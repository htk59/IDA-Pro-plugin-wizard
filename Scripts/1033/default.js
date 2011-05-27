
function OnFinish(selProj, selObj)
{
    var oWizard = wizard;
	try
	{
	    var pluginVersion = oWizard.FindSymbol("PLUGIN_VERSION");
		if (pluginVersion != null && pluginVersion != "")
		{
			pluginVersion = pluginVersion.split('.');
			if (pluginVersion.length >= 2)
			{
			    oWizard.AddSymbol("MAJOR", pluginVersion[0]);
				oWizard.AddSymbol("MINOR", pluginVersion[1]);
			}
			if (pluginVersion.length >= 3)
			{
			    oWizard.AddSymbol("BUILD", pluginVersion[2]);
			}
			if (pluginVersion.length >= 4)
			{
			    oWizard.AddSymbol("REVISION", pluginVersion[3]);
			}
			if (pluginVersion.length >= 5)
			{
			    oWizard.AddSymbol("MAJORREVISION", pluginVersion[3]);
				oWizard.AddSymbol("MINORREVISION", pluginVersion[4]);
			}
		}
        var strProjectPath = oWizard.FindSymbol('PROJECT_PATH');
        var strProjectName = oWizard.FindSymbol('PROJECT_NAME');
        var bEmptyProject = oWizard.FindSymbol("EMPTY_PROJECT");

		// Create symbols based on the project name
		wizard.AddSymbol("RC_FILE_NAME", CreateSafeRCFileName(strProjectName) + ".rc");

		selProj = CreateCustomProject(strProjectName, strProjectPath);
		selProj.Object.Keyword = "Win32Proj";
		AddConfig(selProj, strProjectName);
		AddFilters(selProj);
		if (!bEmptyProject)
		{
		    AddFilesToProjectWithInfFile(selProj, strProjectName);
			SetPchSettings(selProj, wizard.FindSymbol("PRE_COMPILED_HEADER"));	
		}
		selProj.Object.Save();
	}
	catch(e)
	{
		if (e.description.length != 0)
			SetErrorInfo(e);
		return e.number
	}
}

function CreateCustomProject(strProjectName, strProjectPath)
{
	try
	{
		var Solution = dte.Solution;
		var strSolutionName = "";
		if (wizard.FindSymbol("CLOSE_SOLUTION"))
		{
			Solution.Close();
			strSolutionName = wizard.FindSymbol("VS_SOLUTION_NAME");
			if (strSolutionName.length)
			{
				var strSolutionPath = strProjectPath.substr(0, strProjectPath.length - strProjectName.length);
				Solution.Create(strSolutionPath, strSolutionName);
			}
		}

		var strProjectNameWithExt = '';
		var VSVersion = wizard.FindSymbol('VS_VERSION');
		if (VSVersion >= 10.0)
		    strProjectNameWithExt = strProjectName + '.vcxproj';
        else
		    strProjectNameWithExt = strProjectName + '.vcproj';

		var oTarget = wizard.FindSymbol("TARGET");
		var oProject;
		var strProjTemplate = CreateCustomProjectFile("4.0");
		if (wizard.FindSymbol("WIZARD_TYPE") == vsWizardAddSubProject)  // vsWizardAddSubProject
		{
			var prjItem = oTarget.AddFromTemplate(strProjTemplate, strProjectNameWithExt);
			oProject = prjItem.SubProject;
		}
		else
		{
		    oProject = oTarget.AddFromTemplate(strProjTemplate, strProjectPath, strProjectNameWithExt);
		}
		var fxtarget = wizard.FindSymbol("TARGET_FRAMEWORK_VERSION");
		if (fxtarget != null && fxtarget != "")
		{
		    fxtarget = fxtarget.split('.', 2);
		    if (fxtarget.length == 2)
		        oProject.Object.TargetFrameworkVersion = parseInt(fxtarget[0]) * 0x10000 + parseInt(fxtarget[1])
		}
		strProjTemplate.Delete();
		return oProject;
	}
	catch(e)
	{
	    if (e.description.length != 0)
	    {
	        var L_ErrMsg_Text = "Error in CreateCustomProject: ";
	        wizard.ReportError(L_ErrMsg_Text + e.description);
	    }
	    throw e;
	}
}

function AddFilters(proj)
{
	try
	{
		// Add the folders to your project
		var strFilter = wizard.FindSymbol('SOURCE_FILTER');
		var group = proj.Object.AddFilter('Source Files');
		group.Filter = strFilter;

		strFilter = wizard.FindSymbol('INCLUDE_FILTER');
		group = proj.Object.AddFilter('Header Files');
		group.Filter = strFilter;

		if (wizard.FindSymbol("PLUGIN_MODULE") || wizard.FindSymbol("DECOMPILER_MODULE") || wizard.FindSymbol("DEBUGGER_MODULE"))
		{
			strFilter = wizard.FindSymbol('RESOURCE_FILTER');
			group = proj.Object.AddFilter('Resource Files');
			group.Filter = strFilter;
		}
	}
	catch(e)
	{
		throw e;
	}
}

function AddConfig(oProj, strProjectName)
{
    var strProjTemplatePath = wizard.FindSymbol('ABSOLUTE_PATH');
    try
	{
	    var strSrcDir = wizard.FindSymbol('SOURCE_PATH')
	    var strIncDir = wizard.FindSymbol('INCLUDE_PATH');
	    var bManifest = wizard.FindSymbol('MANIFEST');
	    var VSVersion = wizard.FindSymbol('VS_VERSION');
	    var bPostbuildCopy = wizard.FindSymbol('POSTBUILD_COPY');
	    // make sure the rootnamespace property is set
	    oProj.Object.RootNamespace = CreateIdentifierSafeName(strProjectName);
	    var oConfigs = oProj.Object.Configurations;
	    for (var nCntr = 1; nCntr <= oConfigs.Count; nCntr++)
        {
            var oConfig = oConfigs(nCntr);
            // Check if it's Debug configuration
            var bDebug = false;
            if (oConfig.Name.toUpperCase().indexOf("DEBUG") != -1)
            {
                bDebug = true;
            }
            // Check if it's x64 configuration
            var bIDA64 = false;
            if (oConfig.Name.toUpperCase().indexOf("64-BIT") != -1)
            {
                bIDA64 = true;
            }

            // General Properties Tab
            if (VSVersion >= 10.0)
            {
                oConfig.OutputDirectory = '$(SolutionDir)Build\\$(IdaSdkVersion)\\$(Configuration)';
                oConfig.IntermediateDirectory = 'Build\\$(IdaSdkVersion)\\$(Configuration)';
            }
            else
            {
                oConfig.OutputDirectory = '$(SolutionDir)Build\\$(IdaSdkVersion)\\$(ConfigurationName)';
                oConfig.IntermediateDirectory = 'Build\\$(IdaSdkVersion)\\$(ConfigurationName)';
            }
            var sdkVersion = wizard.FindSymbol('IDA_SDK_VERSION');
            var strTargetExt = wizard.FindSymbol('X86_EXTENSION');
            var strTargetName = '$(ProjectName)';
            if (bIDA64)
            {
                strTargetExt = wizard.FindSymbol('X64_EXTENSION');
                if (wizard.FindSymbol('LOADER_MODULE') || wizard.FindSymbol('PROCESSOR_MODULE'))
                    strTargetName += "64";
            }
			sdkVersion = Number(sdkVersion) / 100;
            if (VSVersion >= 10.0)
            {
                var GeneralRule = oConfig.Rules.Item("ConfigurationGeneral");
                GeneralRule.SetPropertyValue("TargetName", strTargetName);
                GeneralRule.SetPropertyValue("TargetExt", strTargetExt);
                var IdaProRule = oConfig.Rules.Item("IdaProSettings");
                IdaProRule.SetPropertyValue("IdaSdkVersion", sdkVersion.toFixed(1));
            }
            //var strExtensionsToDeleteOnClean = addSemiColonIfNeeded(oConfig.DeleteExtensionsOnClean);
            //strExtensionsToDeleteOnClean += '*' + strTargetExt;
            oConfig.DeleteExtensionsOnClean = "$(ExtensionsToDeleteOnClean);*" + strTargetExt;
            oConfig.ConfigurationType = typeDynamicLibrary;
            oConfig.useOfMfc = useOfMfc.useMfcStdWin;
            oConfig.useOfAtl = useOfATL.useATLNotSet;
            oConfig.ATLMinimizesCRunTimeLibraryUsage = false;

            if (!bDebug)
                oConfig.WholeProgramOptimization = WholeProgramOptimizationLinkTimeCodeGen;

            var fUnicode = wizard.FindSymbol('UNICODE');
            if (fUnicode)
                oConfig.CharacterSet = charSetUnicode;
            else
                oConfig.CharacterSet = charSetMBCS;

            // Debugging
            var debugSettings = oConfig.DebugSettings;
            if (bPostbuildCopy)
            {
                var strDebugger;
                if (bIDA64)
                {
                    strDebugger = (sdkVersion >= 6.0) ? "idaq64.exe" : "idag64.exe"
                }
                else
                {
                    strDebugger = (sdkVersion >= 6.0) ? "idaq.exe" : "idag.exe"
                }
                debugSettings.WorkingDirectory = "$(IdaBinaryDir)";
                debugSettings.Command = "$(IdaBinaryDir)" + strDebugger;
                debugSettings.PDBPath = '$(OutDir)';
            }

            // C++ Properties
            var CLTool = oConfig.Tools('VCCLCompilerTool');
            var strAdditionalIncludeDir = addSemiColonIfNeeded(CLTool.AdditionalIncludeDirectories);
            strAdditionalIncludeDir += strIncDir + ";" + "$(IdaSdkIncludeDir)";
            CLTool.AdditionalIncludeDirectories = strAdditionalIncludeDir;
	        CLTool.SuppressStartupBanner = true;
	        CLTool.WarningLevel = warningLevelOption.warningLevel_3;
	        CLTool.UsePrecompiledHeader = pchNone;
	        if (bDebug)
	        {
	            CLTool.DebugInformationFormat = debugOption.debugEditAndContinue;
	            CLTool.RuntimeLibrary = runtimeLibraryOption.rtMultiThreadedDebug;
	            CLTool.MinimalRebuild = true;
	            CLTool.BasicRuntimeChecks = basicRuntimeCheckOption.runtimeBasicCheckAll;
	            CLTool.Optimization = optimizeOption.optimizeDisabled;
	        }
	        else
	        {
	            CLTool.DebugInformationFormat = debugOption.debugEnabled;
	            CLTool.RuntimeLibrary = runtimeLibraryOption.rtMultiThreaded;
	            CLTool.Optimization = optimizeOption.optimizeMaxSpeed;
	            //CLTool.WholeProgramOptimization = true;
	        }

	        if (VSVersion >= 10.0)
	        {
	            CLTool.AdditionalOptions += "/Wp64"
	            CLTool.AdditionalOptions += "/GA"
	        }
	        else
	        {
	            CLTool.Detect64BitPortabilityProblems = true;
	            CLTool.OptimizeForWindowsApplication = true;
	        }
	        CLTool.StringPooling = true;
	        CLTool.ExceptionHandling = cppExceptionHandlingYesWithSEH;
	        CLTool.RuntimeTypeInfo = true;
	        CLTool.EnableFunctionLevelLinking = true;
	        CLTool.OmitFramePointers = true;
	        CLTool.EnableIntrinsicFunctions = true;
	        CLTool.CallingConvention = callingConventionOption.callConventionStdCall;
	        CLTool.BufferSecurityCheck = true;
	        var strDefines = GetPlatformDefine(oConfig);
	        strDefines += "_WINDOWS;STRICT;_USRDLL;";
	        if (bDebug)
	            strDefines += "_DEBUG;";
	        else
	            strDefines += "NDEBUG;";
	        if (VSVersion >= 8.0)
	            strDefines += "_CRT_SECURE_NO_DEPRECATE;";
	        strDefines += "MAXSTR=1024;NO_OBSOLETE_FUNCS;__NT__;__IDP__";
	        if (bIDA64)
	        {
	            strDefines += ";__EA64__";
	            if (wizard.FindSymbol('DEBUGGER_MODULE'))
	                strDefines += ";__X64__";
	        }
	        CLTool.PreprocessorDefinitions = strDefines;

	        var LinkTool = oConfig.Tools('VCLinkerTool');
	        LinkTool.SubSystem = subSystemOption.subSystemWindows;
	        LinkTool.SuppressStartupBanner = true;
	        LinkTool.TargetMachine = machineTypeOption.machineX86;
	        var strAdditionalLibraryDirectories = addSemiColonIfNeeded(LinkTool.AdditionalLibraryDirectories);
	        if (bIDA64)
	        {
	            strAdditionalLibraryDirectories += "$(IdaSdkLibraryDir)vc.w64";
	            if (wizard.FindSymbol('DEBUGGER_MODULE'))
	            {
	                strAdditionalLibraryDirectories = addSemiColonIfNeeded(strAdditionalLibraryDirectories);
	                strAdditionalLibraryDirectories += "$(IdaSdkLibraryDir)vc.x64";
	            }
	        }
            else
	        {
	            strAdditionalLibraryDirectories += "$(IdaSdkLibraryDir)vc.32";
	        }
	        var strAdditionalDependencies = addSemiColonIfNeeded(LinkTool.AdditionalDependencies);
	        strAdditionalDependencies = "ida.lib";

	        LinkTool.AdditionalLibraryDirectories = strAdditionalLibraryDirectories;
	        LinkTool.AdditionalDependencies = strAdditionalDependencies;
	        LinkTool.GenerateDebugInformation = true;

	        if (bDebug)
	        {
	            LinkTool.LinkIncremental = linkIncrementalType.linkIncrementalYes;
	            LinkTool.LinkTimeCodeGeneration = LinkTimeCodeGenerationOption.LinkTimeCodeGenerationOptionDefault;
	            LinkTool.EnableCOMDATFolding = optFoldingType.optFoldingDefault;
	            LinkTool.OptimizeReferences = optRefType.optNoReferences;
	        }
	        else
	        {
	            LinkTool.LinkIncremental = linkIncrementalType.linkIncrementalNo;
	            LinkTool.LinkTimeCodeGeneration = LinkTimeCodeGenerationOption.LinkTimeCodeGenerationOptionDefault;
	            LinkTool.EnableCOMDATFolding = optFoldingType.optFolding;
	            LinkTool.OptimizeReferences = optRefType.optReferences;
	        }
	        if (VSVersion >= 10.0)
	        {
	            LinkTool.ImportLibrary = "$(OutDir)$(TargetName).lib";
	        }
	        else
	        {
	            LinkTool.OutputFile = "$(OutDir)" + strTargetName + strTargetExt;
	            LinkTool.ImportLibrary = "$(OutDir)" + strTargetName + ".lib";
	        }
	        var strMapFile = "$(OutDir)" + strTargetName + ".mpv";
	        LinkTool.GenerateMapFile = true;
	        LinkTool.MapFileName = strMapFile;
	        LinkTool.ProgramDatabaseFile = "$(OutDir)$(ProjectName).pdb";

	        LinkTool.GenerateManifest = false;
	        var strAdditionalOptions = '/export:';
	        if (wizard.FindSymbol('LOADER_MODULE'))
	            strAdditionalOptions += "LDSC";
	        else if (wizard.FindSymbol('PROCESSOR_MODULE'))
	            strAdditionalOptions += "LPH";
	        else
	            strAdditionalOptions += "PLUGIN";
	        LinkTool.AdditionalOptions = strAdditionalOptions;

	        // Manifest settings
	        if (bManifest)
	        {
	            var ManifestTool = oConfig.Tools('VCManifestTool');
	            if (VSVersion >= 10.0)
	            {
	                //ManifestTool.EmbedManifest = true
	                //ManifestTool.AssemblyIdentity = "$(TargetFileName), type=win32, version=2.0.0.0"
	            }
	            else
	            {
	                ManifestTool.EmbedManifest = false;
	                ManifestTool.OutputManifestFile = '$(TargetPath).manifest';
	            }
	        }

	        // Resource settings
	        if (wizard.FindSymbol("PLUGIN_MODULE") || wizard.FindSymbol("DECOMPILER_MODULE") || wizard.FindSymbol("DEBUGGER_MODULE"))
	        {
	            var RCTool = oConfig.Tools("VCResourceCompilerTool");
	            RCTool.Culture = wizard.FindSymbol("LCID");
	            RCTool.AdditionalIncludeDirectories = "$(IntDir);" + strIncDir;
	            if (bDebug)
	                RCTool.PreprocessorDefinitions = "_DEBUG";
	            else
	                RCTool.PreprocessorDefinitions = "NDEBUG";
	        }

	        // Post-build settings
	        if (bPostbuildCopy)
	        {
	            var PostBuildTool = oConfig.Tools("VCPostBuildEventTool");
	            var strCopyToFolder;
	            if (wizard.FindSymbol("LOADER_MODULE"))
	                strCopyToFolder = '$(IdaLoaderDir)';
	            else if (wizard.FindSymbol("PROCESSOR_MODULE"))
	                strCopyToFolder = '$(IdaProcDir)'
	            else
	                strCopyToFolder = '$(IdaPluginDir)'
	            PostBuildTool.Description = 'Copying "$(TargetFileName)" to "' + strCopyToFolder + '"...';
	            PostBuildTool.CommandLine = 'copy /b /y "$(TargetDir)$(TargetFileName)" "' + strCopyToFolder + '"';
	        }
	    }
	}
	catch(e)
	{
		throw e;
	}
}

function SetPchSettings(oProj, bUse)
{
    try
    {
        var strHeaderFile = wizard.FindSymbol('PLUGIN_HEADER');
        var strImplFile = wizard.FindSymbol('PLUGIN_IMPL');
        file = oProj.Object.Files(strImplFile);

        var oConfigs = oProj.Object.Configurations;

        for (var i = 1; i <= oConfigs.Count; i++)
        {
            oConfig = oConfigs.Item(i);
            var CLTool = oConfig.Tools("VCCLCompilerTool");
            if (bUse)
            {
                // setup /Yu (using precompiled headers)
                CLTool.UsePrecompiledHeader = pchUseUsingSpecific;
                CLTool.PrecompiledHeaderThrough = strHeaderFile;
                // setup /Yc (create precompiled header)
                fileConfig = file.FileConfigurations(oConfig.Name);
                fileConfig.Tool.UsePrecompiledHeader = pchCreateUsingSpecific;
            }
            else
            {
                CLTool.UsePrecompiledHeader = pchNone;
                CLTool.PrecompiledHeaderThrough = '';
            }
        }
    }
    catch (e)
    {
        throw e;
    }
}

function Capitalize(str)
{
    return str.toLowerCase().replace(/\b[a-z]/g, function (w) { return w.toUpperCase() });
}

function addSemiColonIfNeeded(nStr)
{
    if (nStr && nStr != "" && nStr.charAt(nStr.length - 1) != ";")
        nStr += ";";
    return nStr;
}

function IsFileExtension(fullFileName, fileExtension)
{
    var regEx = new RegExp(fileExtension, "i");
    return fullFileName.match(regEx);
}

function SetFileProperties(projfile, strName)
{
    return false;
}

function GetTargetName(strName, strProjectName, strResPath, strHelpPath)
{
	try
	{
		var strTarget = strName;
		var strSrcDir = wizard.FindSymbol('SOURCE_PATH')
		var strIncDir = wizard.FindSymbol('INCLUDE_PATH');

		if (strName.substr(0, 4) == "root")
		{
			if (strName == "root.manifest")
			{
				strTarget = strResPath + "\\" + strProjectName + strName.substr(4);
			}
			else
			{
				if (IsFileExtension(strName, ".h"))
					strTarget = strIncDir + "\\" + strProjectName + strName.substr(4);
				else
					strTarget = strSrcDir + "\\" + strProjectName + strName.substr(4);
			}
			return strTarget;
		}

		switch (strName)
		{
			case "readme.txt":
				strTarget = "ReadMe.txt";
				break;
			case "resource.h":
				strTarget = strIncDir + "\\Resource.h";
				break;
		}

		return strTarget;
	}
	catch(e)
	{
		throw e;
	}
}

/******************************************************************************
Description: Creates a C++ project file in a temp location  with the platforms
             the project should target pre-populated
Returns: a string representing a generated project file with the platforms
         pre-populated.
******************************************************************************/
function CreateCustomProjectFile(ToolsVersion)
{
    var bIDA64 = wizard.FindSymbol("X64_SUPPORT")
    var VSVersion = wizard.FindSymbol("VS_VERSION");
    var astrPlatforms = new Array();
    astrPlatforms.push("Win32");
    var astrConfigName = new Array();
    astrConfigName.push("Debug 32-bit");
    astrConfigName.push("Release 32-bit");
    if (bIDA64)
    {
        astrConfigName.push("Debug 64-bit");
        astrConfigName.push("Release 64-bit");
    }
    try
    {
        var oFSO;
        oFSO = new ActiveXObject("Scripting.FileSystemObject");
        var TemporaryFolder = 2;
        var oFolder = oFSO.GetSpecialFolder(TemporaryFolder);
        var strProjFile = oFSO.GetAbsolutePathName(oFolder.Path) + "\\";
        if (VSVersion >= 10.0)
            strProjFile += "default.vcxproj";
        else
            strProjFile += "default.vcproj";
        var oStream = oFSO.CreateTextFile(strProjFile, true, false);

        if (VSVersion >= 10.0)
        {
            oStream.WriteLine("<Project DefaultTargets=\"Build\" ToolsVersion=\"" + ToolsVersion + "\" xmlns=\"http://schemas.microsoft.com/developer/msbuild/2003\">");
            oStream.WriteLine("  <ItemGroup Label=\"ProjectConfigurations\">");
        }
        else
        {
            var strVSVersion = VSVersion.toFixed(2);
            var TargetFrameworkVersion;
            var fxtarget = wizard.FindSymbol("TARGET_FRAMEWORK_VERSION");
            if (fxtarget != null && fxtarget != "")
            {
                fxtarget = fxtarget.split('.', 2);
                if (fxtarget.length == 2)
                    TargetFrameworkVersion = parseInt(fxtarget[0]) * 0x10000 + parseInt(fxtarget[1]);
            }
            oStream.WriteLine("<?xml version=\"1.0\"?>");
            if (TargetFrameworkVersion != undefined)
                oStream.WriteLine("<VisualStudioProject ProjectType=\"Visual C++\" Version=\"" + strVSVersion + "\" TargetFrameworkVersion=\"" + TargetFrameworkVersion + "\">");
            else
                oStream.WriteLine("<VisualStudioProject ProjectType=\"Visual C++\" Version=\"" + strVSVersion + "\">");
            if (VSVersion >= 8.0)
                oStream.WriteLine("	<Platforms>");
        }
        for (var i = 0; i < astrPlatforms.length; i++)
        {
            if (VSVersion >= 10.0)
            {
                for (var j = 0; j < astrConfigName.length; j++)
                {
                    oStream.WriteLine("    <ProjectConfiguration Include=\"" + astrConfigName[j] + "|" + astrPlatforms[i] + "\">");
                    oStream.WriteLine("      <Configuration>" + astrConfigName[j] + "</Configuration>");
                    oStream.WriteLine("      <Platform>" + astrPlatforms[i] + "</Platform>");
                    oStream.WriteLine("    </ProjectConfiguration>");
                }
            }
            else
            {
                oStream.WriteLine("		<Platform Name=\"" + astrPlatforms[i] + "\"/>");
            }
        }
        if (VSVersion >= 10.0)
        {
            oStream.WriteLine("  </ItemGroup>");
            oStream.WriteLine();
            oStream.WriteLine("  <PropertyGroup Label=\"Globals\" >");
            oStream.WriteLine("  </PropertyGroup>");
            oStream.WriteLine();
            oStream.WriteLine("  <Import Project=\"$(VCTargetsPath)\\Microsoft.CPP.Default.props\" />");
            oStream.WriteLine();
        }
        else if (VSVersion >= 8.0)
        {
            oStream.WriteLine("	</Platforms>");
            oStream.WriteLine("	<Configurations>");
        }

        for (var i = 0; i < astrPlatforms.length; i++)
        {
            for (var j = 0; j < astrConfigName.length; j++)
            {
                if (VSVersion >= 10.0)
                {
                    oStream.WriteLine("  <PropertyGroup Condition=\"'$(Configuration)|$(Platform)'=='" + astrConfigName[j] + "|" + astrPlatforms[i] + "'\" Label=\"Configuration\" >");
                    oStream.WriteLine("    <ConfigurationType>DynamicLibrary</ConfigurationType>");
                    oStream.WriteLine("  </PropertyGroup>");
                }
                else
                {
                    oStream.WriteLine("		<Configuration Name=\"" + astrConfigName[j] + "|" + astrPlatforms[i] + "\"/>");
                }
            }
        }
        if (VSVersion >= 10.0)
        {
            var strWizardPath = wizard.FindSymbol('RELATIVE_PATH');
            oStream.WriteLine();
            oStream.WriteLine("  <Import Project=\"$(VCTargetsPath)\\Microsoft.Cpp.props\" />");
            oStream.WriteLine();
            oStream.WriteLine("  <ImportGroup Label=\"ExtensionSettings\" >");
            oStream.WriteLine("    <Import Project=\"$(VCInstallDir)VCWizards\\AppWiz\\IDA Pro\\MyProperties.props\" />");
            oStream.WriteLine("  </ImportGroup>");
            oStream.WriteLine();
            for (var i = 0; i < astrPlatforms.length; i++)
            {
                for (var j = 0; j < astrConfigName.length; j++)
                {
                    oStream.WriteLine("  <ImportGroup Label=\"PropertySheets\" Condition=\"'$(Configuration)|$(Platform)'=='" + astrConfigName[j] + "|" + astrPlatforms[i] + "'\">");
                    oStream.WriteLine("    <Import Project=\"$(LocalAppData)\\Microsoft\\VisualStudio\\10.0\\Microsoft.Cpp.$(Platform).user.props\" Condition=\"exists('$(LocalAppData)\\Microsoft\\VisualStudio\\10.0\\Microsoft.Cpp.$(Platform).user.props')\" />");
                    oStream.WriteLine("  </ImportGroup>");
                    oStream.WriteLine();
                }
            }
            oStream.WriteLine("  <PropertyGroup Label=\"UserMacros\" >");
            oStream.WriteLine("  </PropertyGroup>");
            oStream.WriteLine();
            oStream.WriteLine("  <ItemDefinitionGroup></ItemDefinitionGroup>");
            oStream.WriteLine("  <ItemGroup></ItemGroup>");
            oStream.WriteLine();
            oStream.WriteLine("  <Import Project=\"$(VCTargetsPath)\\Microsoft.CPP.targets\" />");
            oStream.WriteLine();
            oStream.WriteLine("  <ImportGroup Label=\"ExtensionTargets\" >");
            oStream.WriteLine("    <Import Project=\"$(VCInstallDir)VCWizards\\AppWiz\\IDA Pro\\MyProperties.targets\" />");
            oStream.WriteLine("  </ImportGroup>");
            oStream.WriteLine("</Project>");
        }
        else
        {
            if (VSVersion >= 8.0)
                oStream.WriteLine("	</Configurations>");
            oStream.WriteLine("	<References/>");
            if (VSVersion >= 8.0)
            {
                oStream.WriteLine("	<Files/>");
                oStream.WriteLine("	<Globals/>");
            }
            oStream.WriteLine("</VisualStudioProject>");
        }
        oStream.Close();
        return oFSO.GetFile(strProjFile);
    }
    catch (e)
    {
        throw e;
    }
}


// SIG // Begin signature block
// SIG // MIIXPgYJKoZIhvcNAQcCoIIXLzCCFysCAQExCzAJBgUr
// SIG // DgMCGgUAMGcGCisGAQQBgjcCAQSgWTBXMDIGCisGAQQB
// SIG // gjcCAR4wJAIBAQQQEODJBs441BGiowAQS9NQkAIBAAIB
// SIG // AAIBAAIBAAIBADAhMAkGBSsOAwIaBQAEFP9REkc7iEsy
// SIG // MTaCMZhRfDelVKKzoIISMTCCBGAwggNMoAMCAQICCi6r
// SIG // EdxQ/1ydy8AwCQYFKw4DAh0FADBwMSswKQYDVQQLEyJD
// SIG // b3B5cmlnaHQgKGMpIDE5OTcgTWljcm9zb2Z0IENvcnAu
// SIG // MR4wHAYDVQQLExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // ITAfBgNVBAMTGE1pY3Jvc29mdCBSb290IEF1dGhvcml0
// SIG // eTAeFw0wNzA4MjIyMjMxMDJaFw0xMjA4MjUwNzAwMDBa
// SIG // MHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xIzAhBgNVBAMTGk1p
// SIG // Y3Jvc29mdCBDb2RlIFNpZ25pbmcgUENBMIIBIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt3l91l2zRTmo
// SIG // NKwx2vklNUl3wPsfnsdFce/RRujUjMNrTFJi9JkCw03Y
// SIG // SWwvJD5lv84jtwtIt3913UW9qo8OUMUlK/Kg5w0jH9FB
// SIG // JPpimc8ZRaWTSh+ZzbMvIsNKLXxv2RUeO4w5EDndvSn0
// SIG // ZjstATL//idIprVsAYec+7qyY3+C+VyggYSFjrDyuJSj
// SIG // zzimUIUXJ4dO3TD2AD30xvk9gb6G7Ww5py409rQurwp9
// SIG // YpF4ZpyYcw2Gr/LE8yC5TxKNY8ss2TJFGe67SpY7UFMY
// SIG // zmZReaqth8hWPp+CUIhuBbE1wXskvVJmPZlOzCt+M26E
// SIG // RwbRntBKhgJuhgCkwIffUwIDAQABo4H6MIH3MBMGA1Ud
// SIG // JQQMMAoGCCsGAQUFBwMDMIGiBgNVHQEEgZowgZeAEFvQ
// SIG // cO9pcp4jUX4Usk2O/8uhcjBwMSswKQYDVQQLEyJDb3B5
// SIG // cmlnaHQgKGMpIDE5OTcgTWljcm9zb2Z0IENvcnAuMR4w
// SIG // HAYDVQQLExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xITAf
// SIG // BgNVBAMTGE1pY3Jvc29mdCBSb290IEF1dGhvcml0eYIP
// SIG // AMEAizw8iBHRPvZj7N9AMA8GA1UdEwEB/wQFMAMBAf8w
// SIG // HQYDVR0OBBYEFMwdznYAcFuv8drETppRRC6jRGPwMAsG
// SIG // A1UdDwQEAwIBhjAJBgUrDgMCHQUAA4IBAQB7q65+Siby
// SIG // zrxOdKJYJ3QqdbOG/atMlHgATenK6xjcacUOonzzAkPG
// SIG // yofM+FPMwp+9Vm/wY0SpRADulsia1Ry4C58ZDZTX2h6t
// SIG // KX3v7aZzrI/eOY49mGq8OG3SiK8j/d/p1mkJkYi9/uEA
// SIG // uzTz93z5EBIuBesplpNCayhxtziP4AcNyV1ozb2AQWtm
// SIG // qLu3u440yvIDEHx69dLgQt97/uHhrP7239UNs3DWkuNP
// SIG // tjiifC3UPds0C2I3Ap+BaiOJ9lxjj7BauznXYIxVhBoz
// SIG // 9TuYoIIMol+Lsyy3oaXLq9ogtr8wGYUgFA0qvFL0QeBe
// SIG // MOOSKGmHwXDi86erzoBCcnYOMIIEejCCA2KgAwIBAgIK
// SIG // YQHPPgAAAAAADzANBgkqhkiG9w0BAQUFADB5MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSMwIQYDVQQDExpNaWNyb3NvZnQg
// SIG // Q29kZSBTaWduaW5nIFBDQTAeFw0wOTEyMDcyMjQwMjla
// SIG // Fw0xMTAzMDcyMjQwMjlaMIGDMQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMQ0wCwYDVQQLEwRNT1BSMR4wHAYDVQQDExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24wggEiMA0GCSqGSIb3DQEB
// SIG // AQUAA4IBDwAwggEKAoIBAQC9MIn7RXKoU2ueiU8AI8C+
// SIG // 1B09sVlAOPNzkYIm5pYSAFPZHIIOPM4du733Qo2X1Pw4
// SIG // GuS5+ePs02EDv6DT1nVNXEap7V7w0uJpWxpz6rMcjQTN
// SIG // KUSgZFkvHphdbserGDmCZcSnvKt1iBnqh5cUJrN/Jnak
// SIG // 1Dg5hOOzJtUY+Svp0skWWlQh8peNh4Yp/vRJLOaL+AQ/
// SIG // fc3NlpKGDXED4tD+DEI1/9e4P92ORQp99tdLrVvwdnId
// SIG // dyN9iTXEHF2yUANLR20Hp1WImAaApoGtVE7Ygdb6v0LA
// SIG // Mb5VDZnVU0kSMOvlpYh8XsR6WhSHCLQ3aaDrMiSMCOv5
// SIG // 1BS64PzN6qQVAgMBAAGjgfgwgfUwEwYDVR0lBAwwCgYI
// SIG // KwYBBQUHAwMwHQYDVR0OBBYEFDh4BXPIGzKbX5KGVa+J
// SIG // usaZsXSOMA4GA1UdDwEB/wQEAwIHgDAfBgNVHSMEGDAW
// SIG // gBTMHc52AHBbr/HaxE6aUUQuo0Rj8DBEBgNVHR8EPTA7
// SIG // MDmgN6A1hjNodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20v
// SIG // cGtpL2NybC9wcm9kdWN0cy9DU1BDQS5jcmwwSAYIKwYB
// SIG // BQUHAQEEPDA6MDgGCCsGAQUFBzAChixodHRwOi8vd3d3
// SIG // Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL0NTUENBLmNy
// SIG // dDANBgkqhkiG9w0BAQUFAAOCAQEAKAODqxMN8f4Rb0J2
// SIG // 2EOruMZC+iRlNK51sHEwjpa2g/py5P7NN+c6cJhRIA66
// SIG // cbTJ9NXkiugocHPV7eHCe+7xVjRagILrENdyA+oSTuzd
// SIG // DYx7RE8MYXX9bpwH3c4rWhgNObBg/dr/BKoCo9j6jqO7
// SIG // vcFqVDsxX+QsbsvxTSoc8h52e4avxofWsSrtrMwOwOSf
// SIG // f+jP6IRyVIIYbirInpW0Gh7Bb5PbYqbBS2utye09kuOy
// SIG // L6t6dzlnagB7gp0DEN5jlUkmQt6VIsGHC9AUo1/cczJy
// SIG // Nh7/yCnFJFJPZkjJHR2pxSY5aVBOp+zCBmwuchvxIdpt
// SIG // JEiAgRVAfJ/MdDhKTzCCBJ0wggOFoAMCAQICEGoLmU/A
// SIG // ACWrEdtFH1h6Z6IwDQYJKoZIhvcNAQEFBQAwcDErMCkG
// SIG // A1UECxMiQ29weXJpZ2h0IChjKSAxOTk3IE1pY3Jvc29m
// SIG // dCBDb3JwLjEeMBwGA1UECxMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSEwHwYDVQQDExhNaWNyb3NvZnQgUm9vdCBB
// SIG // dXRob3JpdHkwHhcNMDYwOTE2MDEwNDQ3WhcNMTkwOTE1
// SIG // MDcwMDAwWjB5MQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSMwIQYD
// SIG // VQQDExpNaWNyb3NvZnQgVGltZXN0YW1waW5nIFBDQTCC
// SIG // ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANw3
// SIG // bvuvyEJKcRjIzkg+U8D6qxS6LDK7Ek9SyIPtPjPZSTGS
// SIG // KLaRZOAfUIS6wkvRfwX473W+i8eo1a5pcGZ4J2botrfv
// SIG // hbnN7qr9EqQLWSIpL89A2VYEG3a1bWRtSlTb3fHev5+D
// SIG // x4Dff0wCN5T1wJ4IVh5oR83ZwHZcL322JQS0VltqHGP/
// SIG // gHw87tUEJU05d3QHXcJc2IY3LHXJDuoeOQl8dv6dbG56
// SIG // 4Ow+j5eecQ5fKk8YYmAyntKDTisiXGhFi94vhBBQsvm1
// SIG // Go1s7iWbE/jLENeFDvSCdnM2xpV6osxgBuwFsIYzt/iU
// SIG // W4RBhFiFlG6wHyxIzG+cQ+Bq6H8mjmsCAwEAAaOCASgw
// SIG // ggEkMBMGA1UdJQQMMAoGCCsGAQUFBwMIMIGiBgNVHQEE
// SIG // gZowgZeAEFvQcO9pcp4jUX4Usk2O/8uhcjBwMSswKQYD
// SIG // VQQLEyJDb3B5cmlnaHQgKGMpIDE5OTcgTWljcm9zb2Z0
// SIG // IENvcnAuMR4wHAYDVQQLExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xITAfBgNVBAMTGE1pY3Jvc29mdCBSb290IEF1
// SIG // dGhvcml0eYIPAMEAizw8iBHRPvZj7N9AMBAGCSsGAQQB
// SIG // gjcVAQQDAgEAMB0GA1UdDgQWBBRv6E4/l7k0q0uGj7yc
// SIG // 6qw7QUPG0DAZBgkrBgEEAYI3FAIEDB4KAFMAdQBiAEMA
// SIG // QTALBgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAN
// SIG // BgkqhkiG9w0BAQUFAAOCAQEAlE0RMcJ8ULsRjqFhBwEO
// SIG // jHBFje9zVL0/CQUt/7hRU4Uc7TmRt6NWC96Mtjsb0fus
// SIG // p8m3sVEhG28IaX5rA6IiRu1stG18IrhG04TzjQ++B4o2
// SIG // wet+6XBdRZ+S0szO3Y7A4b8qzXzsya4y1Ye5y2PENtEY
// SIG // Ib923juasxtzniGI2LS0ElSM9JzCZUqaKCacYIoPO8cT
// SIG // ZXhIu8+tgzpPsGJY3jDp6Tkd44ny2jmB+RMhjGSAYwYE
// SIG // lvKaAkMve0aIuv8C2WX5St7aA3STswVuDMyd3ChhfEjx
// SIG // F5wRITgCHIesBsWWMrjlQMZTPb2pid7oZjeN9CKWnMyw
// SIG // d1RROtZyRLIj9jCCBKowggOSoAMCAQICCmEFojAAAAAA
// SIG // AAgwDQYJKoZIhvcNAQEFBQAweTELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEjMCEGA1UEAxMaTWljcm9zb2Z0IFRpbWVzdGFt
// SIG // cGluZyBQQ0EwHhcNMDgwNzI1MTkwMTE1WhcNMTMwNzI1
// SIG // MTkxMTE1WjCBszELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjENMAsG
// SIG // A1UECxMETU9QUjEnMCUGA1UECxMebkNpcGhlciBEU0Ug
// SIG // RVNOOjg1RDMtMzA1Qy01QkNGMSUwIwYDVQQDExxNaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIIBIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8AQtspbAGoFn
// SIG // JbEmYrMTS84wusASOPyBZTQHxDayJGj2BwTAB5f0t/F7
// SIG // HmIsRtlLpFE0t9Ns7Vo7tIOhRz0RCC41a0XmwjyMAmYC
// SIG // qRhp60rtJyzuPHdbpNRwmUtXhBDQry34iR3m6im058+e
// SIG // BmKnclTCO8bPP7jhsFgQbOWl18PCdTe99IXhgego2Bvx
// SIG // 8q7xgqPW1wOinxWE+z36q+G2MsigAmTz5v8aJnEIU4oV
// SIG // AvKDJ3ZJgnGn760yeMbXbBZPImWXYk1GL/8jr4XspnC9
// SIG // A8va2DIFxSuQQLae1SyGbLfLEzJ9jcZ+rhcvMvxmux2w
// SIG // RVX4rfotZ4NnKZOE0lqhIwIDAQABo4H4MIH1MB0GA1Ud
// SIG // DgQWBBTol/b374zx5mnjWWhO95iKet2bLjAfBgNVHSME
// SIG // GDAWgBRv6E4/l7k0q0uGj7yc6qw7QUPG0DBEBgNVHR8E
// SIG // PTA7MDmgN6A1hjNodHRwOi8vY3JsLm1pY3Jvc29mdC5j
// SIG // b20vcGtpL2NybC9wcm9kdWN0cy90c3BjYS5jcmwwSAYI
// SIG // KwYBBQUHAQEEPDA6MDgGCCsGAQUFBzAChixodHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL3RzcGNh
// SIG // LmNydDATBgNVHSUEDDAKBggrBgEFBQcDCDAOBgNVHQ8B
// SIG // Af8EBAMCBsAwDQYJKoZIhvcNAQEFBQADggEBAA0/d1+R
// SIG // PL6lNaTbBQWEH1by75mmxwiNL7PNP3HVhnx3H93rF7K9
// SIG // fOP5mfIKRUitFLtpLPI+Z2JU8u5/JxGSOezO2YdOiPdg
// SIG // RyN7JxVACJ+/DTEEgtg1tgycANOLqnhhxbWIQZ0+NtxY
// SIG // pCebOtq9Bl0UprIPTMGOPIvyYpn4Zu3V8xwosDLbyjEJ
// SIG // vPsiaEZM+tNzIucpjiIA+1a/Bq6BoBW6NPkojh9KYgWh
// SIG // ifWBR+kNkQjXWDuPHmsJaanASHxVgj9fADhDnAbMP9gv
// SIG // v09zCT39ul70x+w3wmRhoE3UPXDMW7ATgcHUozEavWTW
// SIG // ltJ6PypbRlMJPM0D+T9ZAMyJU2ExggR5MIIEdQIBATCB
// SIG // hzB5MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSMwIQYDVQQDExpN
// SIG // aWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQQIKYQHPPgAA
// SIG // AAAADzAJBgUrDgMCGgUAoIGkMBkGCSqGSIb3DQEJAzEM
// SIG // BgorBgEEAYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgor
// SIG // BgEEAYI3AgEVMCMGCSqGSIb3DQEJBDEWBBRD573odGht
// SIG // DuvZD+9oREp/ubzpsDBEBgorBgEEAYI3AgEMMTYwNKAa
// SIG // gBgAYwB1AHMAdABvAG0AdwBpAHoALgBqAHOhFoAUaHR0
// SIG // cDovL21pY3Jvc29mdC5jb20wDQYJKoZIhvcNAQEBBQAE
// SIG // ggEARB6u45hpHcw9dJ1kVqrdxQKIDXpHqE5ug51VwhkY
// SIG // KUgWTmI5ra0+ufLmKXYQOLNPSnNgWonKeG0w8K5QD4UW
// SIG // J9C0JG5nAqlyfJIaaq6htLw2cz5Ke453xiNP1LNuwWtP
// SIG // VdKQLmdPul5VW/SYXkxJ4VKZ/eUM6WoXanYD+NiLvcWj
// SIG // uSoQhohdvXnN8f6z6Xxzta7xQ+GdVShJFPa1a9IQDmLd
// SIG // g3KbK8pvBzCWZLp7XuF9OsxlNd6iFxZU78FPbN5YtGnR
// SIG // cLxR4MzBxavVh9pyEHscP4EwPkeaetMYIh2ufrbEr98R
// SIG // SL/gEjT4hsxwiwE04QkgQqNcRKTPC047gbeYqqGCAh8w
// SIG // ggIbBgkqhkiG9w0BCQYxggIMMIICCAIBATCBhzB5MQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMSMwIQYDVQQDExpNaWNyb3Nv
// SIG // ZnQgVGltZXN0YW1waW5nIFBDQQIKYQWiMAAAAAAACDAH
// SIG // BgUrDgMCGqBdMBgGCSqGSIb3DQEJAzELBgkqhkiG9w0B
// SIG // BwEwHAYJKoZIhvcNAQkFMQ8XDTEwMDMxOTEzMDA1OFow
// SIG // IwYJKoZIhvcNAQkEMRYEFI2my6oEaZuQ5u31IF2xpaLt
// SIG // 0zomMA0GCSqGSIb3DQEBBQUABIIBABZaWeWNnLDWxt8t
// SIG // t0w1E1e+LMEzC1oELO1CyyPJ/z4mYrbtJkEjVO4n9Qrh
// SIG // WRCwiFVMEbBnb0fqvXncDMwBvuu7ODjLhXDAsaZgHOof
// SIG // IWhvUTgFb+iJmq3E9wd/9xAwppwHemW8xXy76cT1BH3G
// SIG // O5F/PlW/DVeMau1E0QmCdWGR3Y648/p9p2v2cwPWGy/z
// SIG // Sry8HYjS2ZfSapOtqJ3WQnEmu5YEhwq6++o9IWROK76I
// SIG // cT3oZoK/097drHGC/LTC+L4NRxRv22MgH16QtBhCWVOd
// SIG // cu0pTmQwz2DjlkcxKF2/pBGnNAWs05oEqr4WLasds3IH
// SIG // pD24xF79NyE/6vam6LQ=
// SIG // End signature block
