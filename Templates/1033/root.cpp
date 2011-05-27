///////////////////////////////////////////////////////////////////////////////
//
//  File     : [!output PROJECT_NAME].cpp
//  Author   : [!output PLUGIN_AUTHOR]
//  Date     : [!output DAY]/[!output MONTH]/[!output YEAR]
//  Homepage : [!output PLUGIN_URL]
//  
//  License  : Copyright © [!output YEAR] [!output COMPANY_NAME]
//
//  This software is provided 'as-is', without any express or
//  implied warranty. In no event will the authors be held liable
//  for any damages arising from the use of this software.
//
///////////////////////////////////////////////////////////////////////////////

//-----------------------------------------------------------------------------

#include "[!output PROJECT_NAME].h"

[!if PLUGIN_MODULE || DECOMPILER_MODULE || DEBUGGER_MODULE]

// Global Variables:
int gSdkVersion;
char gszVersion[]      = "[!output MAJOR].[!output MINOR].[!output BUILD].[!output REVISION]";
// Plugin name listed in (Edit | Plugins)
char gszWantedName[]   = "[!output WANTED_NAME]";
// plug-in hotkey
char gszWantedHotKey[] = "[!output WANTED_HOTKEY]";

char *gszPluginHelp;
char *gszPluginComment;
[!if DECOMPILER_MODULE]
// Hex-Rays API pointer
hexdsp_t *hexdsp = NULL;

static bool inited = false;
[!endif]

[!if DEBUGGER_MODULE]
[!if VERBOSE_COMMENTS]
//-----------------------------------------------------------------------------
// Function: callback
//
// The debugger calls this function when handling any HT_DBG events.
// The user_data pointer is passed to this function allowing the use
// of previously defined data structures and user options.
//-----------------------------------------------------------------------------
[!endif]
int idaapi callback(void* user_data, int notification_code, va_list va)
{
	switch (notification_code)
	{
		case dbg_bpt:
		{
			break;
		}
		case dbg_step_into:
		{
			break;
		}
		case dbg_process_exit:
		{
			break;
		}
		default:
			break;
	}
	return 0;
}
[!endif]

[!if DECOMPILER_MODULE]
[!if VERBOSE_COMMENTS]
//-----------------------------------------------------------------------------
// Function: callback
//
// This callback handles the hexrays right-click and maturity events
//-----------------------------------------------------------------------------
[!endif]
int idaapi callback(void *, hexrays_event_t event, va_list va)
{
	switch ( event )
	{
		case hxe_refresh_pseudocode:
			break;

		case hxe_right_click:
			break;

		case hxe_maturity:
			break;
	}
	return 0;
}
[!endif]

bool GetKernelVersion(char *szBuf, int bufSize)
{
	int major, minor, len;
	get_kernel_version(szBuf, bufSize);
	if ( qsscanf(szBuf, "%d.%n%d", &major, &len, &minor) != 2 )
		return false;
	if ( isdigit(szBuf[len + 1]) )
		gSdkVersion = 100*major + minor;
	else
		gSdkVersion = 10 * (10*major + minor);
	return true;
}

[!if VERBOSE_COMMENTS]
//-----------------------------------------------------------------------------
// Function: init
//
// init is a plugin_t function. It is executed when the plugin is
// initially loaded by IDA.
// Three return codes are possible:
//    PLUGIN_SKIP - Plugin is unloaded and not made available
//    PLUGIN_KEEP - Plugin is kept in memory
//    PLUGIN_OK   - Plugin will be loaded upon 1st use
//
// Check are added here to ensure the plug-in is compatible with
// the current disassembly.
//-----------------------------------------------------------------------------
[!endif]
int initPlugin(void)
{
	char szBuffer[MAXSTR];
	char sdkVersion[32];
[!if PLUGIN_MODULE]
	int nRetCode = PLUGIN_OK;
[!endif]
[!if DECOMPILER_MODULE]
	int nRetCode = PLUGIN_KEEP;
[!endif]
[!if DEBUGGER_MODULE]
	int nRetCode = PLUGIN_KEEP;
[!endif]
	HINSTANCE hInstance = ::GetModuleHandle(NULL);

[!if MANIFEST]
	// InitCommonControlsEx() is required on Windows XP if an application
	// manifest specifies use of ComCtl32.dll version 6 or later to enable
	// visual styles.  Otherwise, any window creation will fail.
	INITCOMMONCONTROLSEX InitCtrls;
	InitCtrls.dwSize = sizeof(InitCtrls);
	// Set this to include all the common control classes you want to use
	// in your application.
	InitCtrls.dwICC = ICC_WIN95_CLASSES;
	InitCommonControlsEx(&InitCtrls);

[!endif]
	// Initialize global strings
	LoadString(hInstance, IDS_PLUGIN_HELP, szBuffer, sizeof(szBuffer));
	gszPluginHelp = qstrdup(szBuffer);
	LoadString(hInstance, IDS_PLUGIN_COMMENT, szBuffer, sizeof(szBuffer));
	gszPluginComment = qstrdup(szBuffer);
	if ( !GetKernelVersion(sdkVersion, sizeof(sdkVersion)) )
	{
		msg("%s: could not determine IDA version\n", gszWantedName);
		nRetCode = PLUGIN_SKIP;
	}
	else if ( gSdkVersion < [!output IDA_SDK_VERSION] )
	{
		warning("Sorry, the %s plugin required IDA v%s or higher\n", gszWantedName, sdkVersion);
		nRetCode = PLUGIN_SKIP;
	}
[!if PLUGIN_MODULE]
	else if ( ph.id != PLFM_386 || ( !inf.is_32bit() && !inf.is_64bit() ) || inf.like_binary() )
	{
		msg("%s: could not load plugin\n", gszWantedName);
		nRetCode = PLUGIN_SKIP;
	}
	else
	{
[!endif]
[!if DECOMPILER_MODULE]
	else if (!init_hexrays_plugin())
	{
		nRetCode = PLUGIN_SKIP; // no decompiler
	}
	else
	{
		install_hexrays_callback(callback, NULL);
		const char *hxver = get_hexrays_version();
		msg("Hex-rays version %s has been detected, %s ready to use\n", hxver, gszWantedName);
		inited = true;

[!endif]
[!if DEBUGGER_MODULE]
	// The hook_to notification_point call below sets up the call back
	// function for HT_DBG events.
	// The third argument is currently set to NULL but can be used to
	// pass a pointer representing user data to the callback function.

	else if (!hook_to_notification_point(HT_DBG, callback, NULL))
	{
		msg("Could not hook to notification point\n");
		nRetCode = PLUGIN_SKIP;
	}
	else
	{
[!endif]
		msg( "%s (v%s) plugin has been loaded\n"
			"  The hotkeys to invoke the plugin is %s.\n"
			"  Please check the Edit/Plugins menu for more informaton.\n",
			gszWantedName, gszVersion, gszWantedHotKey);
	}
	return nRetCode;
}

[!if VERBOSE_COMMENTS]
//-----------------------------------------------------------------------------
// Function: term
//
// term is a plugin_t function. It is executed when the plugin is
// unloading. Typically cleanup code is executed here.
//-----------------------------------------------------------------------------
[!endif]
void termPlugin(void)
{
[!if DECOMPILER_MODULE]
	if ( inited )
	{
		// clean up
		remove_hexrays_callback(callback, NULL);
		term_hexrays_plugin();
	}
[!endif]
[!if DEBUGGER_MODULE]
	// The debugger must be unhooked before exiting the plugin,
	// otherwise the HT_DBG event will be sent to a callback
	// that is no longer in memory.
	// NOTE: this call must use the same arguments as passed
	//       to hook_to_notification_point()

	unhook_from_notification_point(HT_DBG, callback, NULL);
[!endif]
}

[!if VERBOSE_COMMENTS]
//-----------------------------------------------------------------------------
// Function: run
//
// run is a plugin_t function. It is executed when the plugin is run.
//
// The argument 'arg' can be passed by adding an entry in
// plugins.cfg or passed manually via IDC:
//
//   success RunPlugin(string name, long arg);
//-----------------------------------------------------------------------------
[!endif]
void runPlugin(int arg)
{
[!if PLUGIN_MODULE || DECOMPILER_MODULE]
	msg("Hello world!\n");
[!endif]
[!if DEBUGGER_MODULE]
	msg("Debugging plugin\n");
[!endif]
//  Uncomment the following code to allow plugin unloading.
//  This allows the editing/building of the plugin without
//  restarting IDA.
//
//  1. to unload the plugin execute the following IDC statement:
//        RunPlugin("[!output PROJECT_NAME]", 415);
//  2. Make changes to source code and rebuild within Visual Studio
//  3. Copy plugin to IDA plugin dir
//     (may be automatic if option was selected within wizard)
//  4. Run plugin via the menu, hotkey, or IDC statement
//
// 	if (arg == 415)
// 	{
// 		PLUGIN.flags |= PLUGIN_UNL;
// 		msg("Unloading [!output PROJECT_NAME] plugin...\n");
// 	}
}

///////////////////////////////////////////////////////////////////////////////
//
//                         PLUGIN DESCRIPTION BLOCK
//
///////////////////////////////////////////////////////////////////////////////
plugin_t PLUGIN =
{
  IDP_INTERFACE_VERSION,
  [!output PLUGIN_FLAGS],              // plugin flags
  initPlugin,           // initialize
  termPlugin,           // terminate. this pointer may be NULL.
  runPlugin,            // invoke plugin
  gszPluginComment,     // comment about the plugin
  gszPluginHelp,        // multiline help about the plugin
  gszWantedName,        // the preferred short name of the plugin
  gszWantedHotKey       // the preferred hotkey to run the plugin
};

[!endif]
[!if LOADER_MODULE]
#include <../ldr/idaldr.h>


// check input file format. if recognized, then return 1
// and fill 'fileformatname'.
// otherwise return 0
//
int accept_file(linput_t *li, char *fileformatname, int n)
{
	memset(fileformatname, 0, MAX_FILE_FORMAT_NAME);
	return 0;
}

// load file into the database.
//
void load_file(linput_t *li, ushort neflag, const char *fileformatname)
{
	return;
}

// initialize user configurable options based on the input file.
//
bool idaapi init_loader_options(linput_t *li)
{
	return true;
}

//----------------------------------------------------------------------
//
//      LOADER DESCRIPTION BLOCK
//
//----------------------------------------------------------------------
loader_t LDSC =
{
	IDP_INTERFACE_VERSION,
	[!output LOADER_FLAGS],                            // loader flags
	accept_file,
	load_file,
	NULL,                         // create output file from the database. this function may be absent.
	NULL,                         // take care of a moved segment (fix up relocations, for example)
	init_loader_options,
};
[!endif]
