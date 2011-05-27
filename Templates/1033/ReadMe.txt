========================================================================
    IDA Pro Plugin Wizard : [!output PROJECT_NAME] Project Overview
========================================================================

IDA Pro Plugin Wizard has created this [!output PROJECT_NAME] project for you as a starting point.

This file contains a summary of what you will find in each of the files that make up your project.

[!output PROJECT_NAME].vcxproj
    This is the main project file for projects generated using an Application Wizard. 
    It contains information about the version of the product that generated the file, and 
    information about the platforms, configurations, and project features selected with the
    Application Wizard.

[!output PROJECT_NAME].vcxproj.filters
    This is the filters file for VC++ projects generated using an Application Wizard. 
    It contains information about the association between the files in your project 
    and the filters. This association is used in the IDE to show grouping of files with
    similar extensions under a specific node (for e.g. ".cpp" files are associated with the
    "Source Files" filter).

Sample.txt
This is a sample template file.

/////////////////////////////////////////////////////////////////////////////
Other standard files:

[!if PLUGIN_MODULE || DECOMPILER_MODULE || DEBUGGER_MODULE]
Resource.h
    This is the standard header file, which defines new resource IDs.
    Microsoft Visual C++ reads and updates this file.

[!if MANIFEST]
[!output PROJECT_NAME].manifest
	Application manifest files are used by Windows XP to describe an applications
	dependency on specific versions of Side-by-Side assemblies. The loader uses this
	information to load the appropriate assembly from the assembly cache or private
	from the application. The Application manifest  maybe included for redistribution
	as an external .manifest file that is installed in the same folder as the application
	executable or it may be included in the executable in the form of a resource.
[!endif]
[!endif]

/////////////////////////////////////////////////////////////////////////////
