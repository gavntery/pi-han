// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// VaryParams.js - Released 2013/12/03 16:15:08 UTC
// ****************************************************************************
//
// This file is part of VaryParams script version 1.5
// 
// The complete source code with test scripts is hosted at:
//    https://bitbucket.org/bitli/varyparams
//
// Copyright (c) 2012-2013 Jean-Marc Lugrin
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
// ****************************************************************************

"use strict";

#feature-id Utilities > VaryParams

#feature-info Apply a process varying a parameter.<br/>\
   Written by Jean-Marc Lugrin (c) 2012,2013.

#iflt __PI_VERSION__ 01.08.00
#error This script requires PixInsight 1.8.0 or higher.
#endif

// ==================================================================================================
// The complete source code is hosted at https://bitbucket.org/bitli/varyparams
// with test scripts and a test workspace
// ==================================================================================================

#define VERSION "1.5"
#define TITLE "VaryParams"

// #define DEBUG true

#include "VaryParams-helpers.jsh"
#include "VaryParams-engine.jsh"
#include "VaryParams-gui.jsh"
#include "VaryParams-driver.jsh"


// ----------------------------------------------------------------------------------------------------------
// Main module, show Dialog when executed
// ----------------------------------------------------------------------------------------------------------
function Vp_main()
{
   Console.hide();

//   currrently call gc() in processing loop to have a more predictable environment
//   jsAutoGC = true;

   var environment = vP_makeEnvironment();

   var guiParameters = new Vp_GUIParameters(environment);
   guiParameters.loadSettings();

   var dialog = new Vp_VaryParamsDialog(environment, guiParameters);
   for ( ;; )
   {
      if ( !dialog.executeAndComplete() ) {
         break;
      }

      var processEngineOrError = vP_makeProcessEngine(environment, guiParameters);
      if ( processEngineOrError.engineCreationError) {
 #ifdef DEBUG
         Console.writeln("main: Error returned from vP_makeProcessEngine: ", processEngineOrError.engineCreationError,
                   ", processEngineOrError.shouldSaveParameters: ", processEngineOrError.shouldSaveParameters);
 #endif
         if (processEngineOrError.shouldSaveParameters) {
            guiParameters.saveSettings();
         }

         (new MessageBox( processEngineOrError.engineCreationError,
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         continue;
      }

      guiParameters.saveSettings();

      Console.show();
      vP_executeForAllValues(processEngineOrError);
      Console.show();

      Console.writeln("VaryParams terminated");

      // Quit after successful execution.
      break;
   }

   // Restore focus on initial view (just to be consistent)
   var v = environment.initialView;
   if (v !== null) {
      v.window.bringToFront();
      v.window.currentView = v;
   }
}


// ----------------------------------------------------------------------------------------------------------
Vp_main();

// ****************************************************************************
// EOF VaryParams.js - Released 2013/12/03 16:15:08 UTC
