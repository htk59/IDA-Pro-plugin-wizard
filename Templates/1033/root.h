///////////////////////////////////////////////////////////////////////////////
//
//  File     : [!output PROJECT_NAME].h
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

#pragma once

#ifdef __NT__
#include <windows.h>
#endif
[!if PLUGIN_MODULE || DECOMPILER_MODULE || DEBUGGER_MODULE]
#include <ida.hpp>
#include <idp.hpp>
#include <loader.hpp>
#include <kernwin.hpp>
[!if DECOMPILER_MODULE]
#include <hexrays.hpp>		// http://www.hex-rays.com/manual/sdk/hexrays_8hpp_source.html
[!endif]
[!if DEBUGGER_MODULE]
#include <dbg.hpp>
[!endif]
#include "resource.h"

[!if MANIFEST]
#ifdef _UNICODE
#if defined _M_IX86
#pragma comment(linker,"/manifestdependency:\"type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='x86' publicKeyToken='6595b64144ccf1df' language='*'\"")
#elif defined _M_X64
#pragma comment(linker,"/manifestdependency:\"type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='amd64' publicKeyToken='6595b64144ccf1df' language='*'\"")
#else
#pragma comment(linker,"/manifestdependency:\"type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'\"")
#endif
#endif
[!endif]

[!endif]

