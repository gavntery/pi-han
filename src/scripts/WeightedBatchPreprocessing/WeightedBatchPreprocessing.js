// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// WeightedBatchPreprocessing.js - Released 2020-01-24T12:08:35Z
// ----------------------------------------------------------------------------
//
// This file is part of Weighted Batch Preprocessing Script version 1.4.4
//
// Copyright (c) 2012 Kai Wiechen. All Rights Reserved.
// Copyright (c) 2019-2020 Roberto Sartori. All Rights Reserved.
// Copyright (c) 2019-2020 Tommaso Rubechi. All Rights Reserved.
// Copyright (c) 2012-2020 Pleiades Astrophoto S.L. All Rights Reserved.
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

/* beautify ignore:start */
#feature-id    Batch Processing > WeightedBatchPreprocessing

#feature-info  An extension of BatchPreprocessing script including an \
               intermediate step to compute statistical weights of light \
               frames.<br/>\
               Original script written by Kai Wiechen. Extensions by Roberto \
               Sartori and Tommaso Rubechi (c) 2019.

#ifndef __PI_ENCODED_VERSION__
#error This script requires PixInsight version 1.8.7 or higher.
#endif
#iflt __PI_ENCODED_VERSION__ "000100080007"
#error This script requires PixInsight version 1.8.7 or higher.
#endif

#include <pjsr/Sizer.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/NumericControl.jsh>

#include "WeightedBatchPreprocessing-global.js"   // global defines
#include "WeightedBatchPreprocessing-helper.js"   // helper functions
#include "WeightedBatchPreprocessing-engine.js"   // stack engine
#include "WeightedBatchPreprocessing-GUI.js"      // GUI part
/* beautify ignore:end */

/*
 * Script entry point
 */
function main()
{
   function perform()
   {
      let
      {
         existingDirectory,
      } = WBPPUtils.shared();

      if ( !engine.calibrateOnly )
         if ( engine.integrate )
            if ( !engine.showIntegrationWarning() )
            {
               engine = null;
               return;
            }

      if ( engine.saveProcessLog )
         console.beginLog();

      try
      {
         console.show();

         console.noteln( "<end><cbr><br>",
            "************************************************************" );
         console.noteln( "WeightedBatchPreprocessing " + VERSION );
         console.noteln( "************************************************************" );

         let T = new ElapsedTime;

         engine.cleanProcessLog();
         if ( !engine.useAsMaster[ ImageType.BIAS ] )
            engine.doBias();
         if ( !engine.useAsMaster[ ImageType.DARK ] )
            engine.doDark();
         if ( !engine.useAsMaster[ ImageType.FLAT ] )
            engine.doFlat();

         engine.doLight();

         console.writeln( "<end><cbr><br>* WeightedBatchPreprocessing: ", T.text );

         console.flush();
         console.hide();

         // show process logs
         engine.showProcessLogs();
      }
      catch ( x )
      {
         ( new MessageBox( x.message, TITLE + " " + VERSION, StdIcon_Error, StdButton_Ok ) ).execute();
         console.hide();
      }

      if ( engine.saveProcessLog )
      {
         let logData = console.endLog();
         let logDate = new Date;
         let logPath = existingDirectory( engine.outputDirectory + "/logs" ) +
            format( "/%04d%02d%02d%02d%02d%02d.log",
               logDate.getUTCFullYear(), logDate.getUTCMonth() + 1, logDate.getUTCDate(),
               logDate.getUTCHours(), logDate.getUTCMinutes(), logDate.getUTCSeconds() );
         try
         {
            let file = File.createFileForWriting( logPath );
            file.write( logData );
            file.close();
         }
         catch ( x )
         {
            ( new MessageBox( x.message, TITLE + " " + VERSION, StdIcon_Error, StdButton_Ok ) ).execute();
         }
      }
   };

   console.hide();

   if ( Parameters.isViewTarget )
      throw new Error( TITLE + " can only be executed in the global context." );

   engine.importParameters();

   let dialog = new StackDialog();

   for ( ;; )
   {
      dialog.updateControls();

      if ( !dialog.execute() )
      {
         if ( ( new MessageBox( "Do you really want to exit " + TITLE + " ?",
               TITLE, StdIcon_Question, StdButton_No, StdButton_Yes ) ).execute() == StdButton_Yes )
            break;
         continue;
      }

      engine.runDiagnostics();
      if ( !engine.hasDiagnosticMessages() || engine.showDiagnosticMessages( true /*cancelButton*/ ) )
         perform();
      engine.clearDiagnosticMessages();

      processEvents();
      gc();
   }

   engine.saveSettings();
   engine = null;
}

main();

// ----------------------------------------------------------------------------
// EOF WeightedBatchPreprocessing.js - Released 2020-01-24T12:08:35Z
