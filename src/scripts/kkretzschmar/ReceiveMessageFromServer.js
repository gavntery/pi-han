// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// ReceiveMessageFromServer.js - Released 2020-01-22T17:07:33Z
// ----------------------------------------------------------------------------
//
//
// Copyright (c) 2003-2020 Pleiades Astrophoto S.L. All Rights Reserved.
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
#include "INDI-helper.jsh"

#define CCD_DEVICE_NAME "CCD Simulator"
/* beautify ignore:end */

var deviceController = new INDIDeviceController;
var ccdFrameController = new INDICCDFrame;

function requestNewImage( ccdController )
{
   ccdController.deviceName = CCD_DEVICE_NAME;
   ccdController.exposureTime = 15;
   ccdController.clientDownloadDirectory = '/home/klaus/tmp2/';
   ccdController.saveClientImages = true;
   ccdController.openClientImages = false;
   ccdController.executeGlobal();
}

function getFocuserPosition( deviceController )
{
   let focuserAbsPosPropertyKey = "/Focuser Simulator/ABS_FOCUS_POSITION/FOCUS_ABSOLUTE_POSITION";
   deviceController.getCommandParameters = focuserAbsPosPropertyKey;
   deviceController.serverCommand = "TRY_GET";
   deviceController.executeGlobal();
   if ( deviceController.getCommandResult.length != 0 )
      return deviceController.getCommandResult;
   return "";
}

function setFocuserPosition( deviceController, newFocuserPos )
{
   console.noteln( format( "<end><cbr><br> Set new focuser pos %i", newFocuserPos ) );
   let focuserAbsPosPropertyKey = "/Focuser Simulator/ABS_FOCUS_POSITION/FOCUS_ABSOLUTE_POSITION";
   deviceController.newProperties = [
      [ focuserAbsPosPropertyKey, "INDI_NUMBER", newFocuserPos.toString() ]
   ];
   deviceController.serverCommand = "SET";
   deviceController.executeGlobal();
   deviceController.serverCommand = "";
}

var a = 25000
var fa = 7.758798
var b = 35000
var fb = 4.188446
var c = 45000
var fc = 5.959773

var R = 0.61803399
var C = 1 - R

function GSSState()
{
   this.__base__ = Object;
   this.__base__();

   this.initialFunctionEval1Send = 0;
   this.initialFunctionEval1Receive = 1;
   this.initialFunctionEval2Send = 2;
   this.initialFunctionEval2Receive = 3;
   this.updateFunction1 = 4;
   this.updateFunction2 = 5;
   this.updateFunction3 = 6;
   this.finished = 7;
}

GSSState.prototype = new Object();

var globalStateEnum = new GSSState();

var globalState = globalStateEnum.initialFunctionEval1;

var x0 = a;
var x1 = 0;
var x2 = 0;
var x3 = c;
if ( Math.abs( c - b ) > Math.abs( b - a ) )
{
   x1 = b;
   x2 = b + C*(c - b);
}
else
{
   x2 = b;
   x1 = b - C*(b - a);
}

var f1 = 0;
var f2 = 0;
var tol = 0.01;

function main()
{
   console.show();

   deviceController.serverConnect = true;
   deviceController.serverHostName = "localhost";
   deviceController.executeGlobal();
   console.noteln( "<end><cbr><br>Connected to INDI server ... " );

   //requestNewImage(ccdFrameController);

   console.writeln( "<end><cbr><br>Receiving messages ... " );

   setFocuserPosition( deviceController, x1 );
   requestNewImage( ccdFrameController );
   globalState = globalStateEnum.initialFunctionEval1Receive;

   let goldenSearchSection = new MessageListener;
   goldenSearchSection.onMessage = function( instance, uniqueId, message )
   {

      switch ( globalState )
      {
         case globalStateEnum.initialFunctionEval1Receive:
            var messageObject = JSON.parse( message );
            var latestFWHM = messageObject.SubframeSelector[ messageObject.SubframeSelector.length - 1 ][ 3 ]
            console.writeln( format( "<end><cbr>Received message from application instance %d with uuid = %s: %s at focuser position %i", instance, uniqueId, latestFWHM.toString(), x1 ) );
            f1 = latestFWHM;

            setFocuserPosition( deviceController, x2 );
            requestNewImage( ccdFrameController );
            globalState = globalStateEnum.initialFunctionEval2Receive;
            break;
         case globalStateEnum.initialFunctionEval2Receive:
            var messageObject = JSON.parse( message );
            var latestFWHM = messageObject.SubframeSelector[ messageObject.SubframeSelector.length - 1 ][ 3 ]
            console.writeln( format( "<end><cbr>Received message from application instance %d with uuid = %s: %s at focuser position %i", instance, uniqueId, latestFWHM.toString(), x2 ) );
            f2 = latestFWHM;
            requestNewImage( ccdFrameController );
            globalState = globalStateEnum.updateFunction1;
            break;
         case globalStateEnum.updateFunction1:
            console.writeln( format( "<end><cbr>Condition %i > %i", Math.abs( x3 - x0 ), tol*(Math.abs( x1 ) + Math.abs( x2 )) ) );
            if ( Math.abs( x3 - x0 ) > tol*(Math.abs( x1 ) + Math.abs( x2 )) )
            {
               if ( f2 < f1 )
               {
                  x0 = x1;
                  x1 = x2;
                  x2 = R * x1 + C * x3;
                  f1 = f2;
                  setFocuserPosition( deviceController, x2 );
                  requestNewImage( ccdFrameController );
                  globalState = globalStateEnum.updateFunction2;
               }
               else
               {
                  x3 = x2;
                  x2 = x1;
                  x1 = R * x2 + C * x0;
                  f2 = f1;
                  setFocuserPosition( deviceController, x1 );
                  requestNewImage( ccdFrameController );
                  globalState = globalStateEnum.updateFunction3;
               }
            }
            else
            {
               globalState = globalStateEnum.finished;
            }

            break;
         case globalStateEnum.updateFunction2:
            var messageObject = JSON.parse( message );
            var latestFWHM = messageObject.SubframeSelector[ messageObject.SubframeSelector.length - 1 ][ 3 ]
            console.writeln( format( "<end><cbr>Received message from application instance %d with uuid = %s: %s at focuser position %i", instance, uniqueId, latestFWHM.toString(), x2 ) );
            f2 = latestFWHM;
            requestNewImage( ccdFrameController );
            globalState = globalStateEnum.updateFunction1;
            break;
         case globalStateEnum.updateFunction3:
            var messageObject = JSON.parse( message );
            var latestFWHM = messageObject.SubframeSelector[ messageObject.SubframeSelector.length - 1 ][ 3 ]
            console.writeln( format( "<end><cbr>Received message from application instance %d with uuid = %s: %s at focuser position %i", instance, uniqueId, latestFWHM.toString(), x2 ) );
            f1 = latestFWHM;
            requestNewImage( ccdFrameController );
            globalState = globalStateEnum.updateFunction1;
            break;
         case globalStateEnum.finished:
            if ( f1 < f2 )
            {
               console.writeln( format( "<end><cbr>Minimum at focuser position %i", x1 ) );
               setFocuserPosition( deviceController, x1 );
            }
            else
            {
               console.writeln( format( "<end><cbr>Minimum at focuser position %i", x2 ) );
               setFocuserPosition( deviceController, x2 );
            }
            break;
         default:
            throw Error( "Unknown state" );
      }

   }

   /* let listener = new MessageListener;
    listener.onMessage = function( instance, uniqueId, message )
    {
       var focuserPosition = getFocuserPosition(deviceController);

       var messageObject = JSON.parse(message);
       var latestFWHM = messageObject.SubframeSelector[messageObject.SubframeSelector.length - 1][3].toString()
       console.writeln( format( "<end><cbr>Received message from application instance %d with uuid = %s: %s at focuser position %s", instance, uniqueId, latestFWHM, focuserPosition ) );

       b = focuserPosition;
       fb = messageObject.SubframeSelector[messageObject.SubframeSelector.length - 1][3];
       var newFocPos = b - 0.5 * ((b-a)*(b-a)*(fb-fc) - (b-c)*(b-c)*(fb-fa)) / ( (b-a)*(fb-fc) - (b-c)*(fb-fa) );
       console.noteln(format("<end><cbr><br> New focuser pos %i", newFocPos));
       if (Math.abs(focuserPosition - newFocPos) >= 100 ) {
          setFocuserPosition(deviceController, newFocPos);
          requestNewImage(ccdFrameController);
       }
    };*/

   for ( ;; )
   {
      console.abortEnabled = true;
      processEvents();

      if ( console.abortRequested )
      {
         goldenSearchSection.enabled = false;
         console.writeln( "<end><cbr>end." );
         console.writeln( format( "%u pending message(s).", CoreApplication.numberOfPendingMessages ) );
         CoreApplication.processPendingMessages();
         break;
      }

      msleep( 10 );
   }

   goldenSearchSection.onMessage = null;
}

main();

// ----------------------------------------------------------------------------
// EOF ReceiveMessageFromServer.js - Released 2020-01-22T17:07:33Z
