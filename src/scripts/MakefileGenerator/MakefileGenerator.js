// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakefileGenerator.js - Released 2019-12-12T17:29:12Z
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.117
//
// Copyright (c) 2009-2019 Pleiades Astrophoto S.L.
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ----------------------------------------------------------------------------

/*
 * PixInsight Makefile Generator
 *
 * Automatic generation of PCL makefiles and projects for FreeBSD, Linux,
 * macOS and Windows platforms.
 *
 * Copyright (c) 2009-2019, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Executable file.
 */

#feature-id    Development > Makefile Generator

#feature-info  A utility script to generate makefiles and project files for \
   PCL development on all supported platforms: 64-bit FreeBSD, Linux, macOS \
   and Windows.<br/>\
   <br/>\
   Written by Juan Conejero (PTeam)<br/>\
   Copyright &copy; 2009-2019 Pleiades Astrophoto, S.L.

#feature-icon  MakefileGenerator.xpm

#ifndef __PI_ENCODED_VERSION__
#error This script requires PixInsight version 1.8.7 or higher.
#endif
#iflt __PI_ENCODED_VERSION__ "000100080007"
#error This script requires PixInsight version 1.8.7 or higher.
#endif

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#include "MakGenGlobal.js"
#include "MakGenUtility.js"
#include "MakGenFileLists.js"
#include "MakGenParameters.js"
#include "MakGenGCCMakefiles.js"
#include "MakGenMSVC9Projects.js"
#include "MakGenMSVC1xProjects.js"
#include "MakGenMSVCProjects.js"
#include "MakGenGenerators.js"
#include "MakGenGUI.js"
#include "MakGenMain.js"

main();

// ----------------------------------------------------------------------------
// EOF MakefileGenerator.js - Released 2019-12-12T17:29:12Z
