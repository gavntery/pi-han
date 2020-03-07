/*
   Star Halo Reducer version 1.0 Beta

   A script for interactive star halo reduction.

   The user defines and selects a preview centered on the star to be corrected,
   and the script provides a real-time preview and a set of controls to define
   algorithm parameters interactively.

   Copyright (C) 2009 Juan M. Gómez (PixInsight user)

   This program is free software: you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation, version 3 of the License.

   This program is distributed in the hope that it will be useful, but WITHOUT
   ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
   FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
   more details.

   You should have received a copy of the GNU General Public License along with
   this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
   Changelog:

   1.0: Code cleanups and adaptation to PixInsight 1.5.9 PJSR engine.
         Published as an official PixInsight script.

   0.1:  Initial version published on PixInsight Forum.
*/

#feature-id    Utilities > StarHaloReducer

#feature-info  A script for interactive star halo reduction.<br/>\
   <br/>\
   This script is a utility for reduction of star halo artifacts. The user defines and selects \
   a preview centered on the star to be corrected, and the script provides a real-time preview \
   and a set of controls to define algorithm parameters interactively.<br/>\
   <br/>\
   Copyright &copy; 2009 Juan M. G&oacute;mez

#feature-icon  StarHaloReducer.xpm

#include <pjsr/NumericControl.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/ColorSpace.jsh>

#define VERSION "1.0 Beta"
#define TITLE "StarHaloReducer"

function StarHaloReducerData()
{
   if ( Parameters.isGlobalTarget )
      throw Error( TITLE + " cannot be executed in the global context." );

   // Default parameters
   this.targetR = 0.50;
   this.targetG = 0.50;
   this.targetB = 0.50;
   this.targetL = 0.50;
   this.maskL = 0.50;
   this.haloMaskRadius = 20;
   this.starRadius = 150;
   this.starProtectedRadius = 12;
   this.starHaloRadius = 40;
   this.smallScaleProtectedRadius = 15;
   this.smallScaleProtection = true;
   this.softenHaloEdges = true;
   this.softenBorderEdges = true;

   if ( Parameters.isViewTarget )
   {
      var window = Parameters.targetView.window;

      if ( Parameters.targetView.isPreview )
         this.originalView = Parameters.targetView;
      else
      {
         this.originalView = window.selectedPreview;
         if (this.originalView.isNull)
            throw Error( TITLE + " must be executed on a preview." );
      }

      if ( Parameters.has( "targetR" ) )
         this.targetR = Parameters.getReal( "targetR" );
      if ( Parameters.has( "targetG" ) )
         this.targetG = Parameters.getReal( "targetG" );
      if ( Parameters.has( "targetB" ) )
         this.targetB = Parameters.getReal( "targetB" );
      if ( Parameters.has( "targetL" ) )
         this.targetL = Parameters.getReal( "targetL" );
      if ( Parameters.has( "maskL" ) )
         this.maskL = Parameters.getReal( "maskL" );
      if ( Parameters.has( "haloMaskRadius" ) )
         this.haloMaskRadius = Parameters.getReal( "haloMaskRadius" );
      if ( Parameters.has( "starRadius" ) )
         this.starRadius = Parameters.getInteger( "starRadius" );
      if ( Parameters.has( "starProtectedRadius" ) )
         this.starProtectedRadius = Parameters.getInteger( "starProtectedRadius" );
      if ( Parameters.has( "starHaloRadius" ) )
         this.starHaloRadius = Parameters.getInteger( "starHaloRadius" );
      if ( Parameters.has( "smallScaleProtectedRadius" ) )
         this.smallScaleProtectedRadius = Parameters.getInteger( "smallScaleProtectedRadius" );
      if ( Parameters.has( "smallScaleProtection" ) )
         this.smallScaleProtection = Parameters.getBoolean( "smallScaleProtection" );
      if ( Parameters.has( "softenHaloEdges" ) )
         this.softenHaloEdges = Parameters.getBoolean( "softenHaloEdges" );
      if ( Parameters.has( "softenBorderEdges" ) )
         this.softenBorderEdges = Parameters.getBoolean( "softenBorderEdges" );
   }
   else
   {
      var window = ImageWindow.activeWindow;

      if (window.isNull) {
         (new MessageBox( "There is no image available.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }

      if (window.previews.length==0) {
         (new MessageBox( "The active image window has no preview defined.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }

      this.originalView = window.selectedPreview;

      if (this.originalView.isNull) {
         (new MessageBox( "<p>The active image window has no preview selected - " +
                          "you must select a preview before running this script.</p>",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }
   }

   this.exportParameters = function()
   {
      with ( this )
      {
         Parameters.set( "targetR", targetR );
         Parameters.set( "targetG", targetG );
         Parameters.set( "targetB", targetB );
         Parameters.set( "targetL", targetL );
         Parameters.set( "maskL", maskL );
         Parameters.set( "haloMaskRadius", haloMaskRadius );
         Parameters.set( "starRadius", starRadius );
         Parameters.set( "starProtectedRadius", starProtectedRadius );
         Parameters.set( "starHaloRadius", starHaloRadius );
         Parameters.set( "smallScaleProtectedRadius", smallScaleProtectedRadius );
         Parameters.set( "smallScaleProtection", smallScaleProtection );
         Parameters.set( "softenHaloEdges", softenHaloEdges );
         Parameters.set( "softenBorderEdges", softenBorderEdges );
      }
   };

   // View-dependent parameters
   this.starXCenter = this.originalView.image.width/2;
   this.starYCenter = this.originalView.image.height/2;
   this.starCenter = new Point( this.starXCenter, this.starYCenter );
   this.haloXCenter = this.originalView.image.width/2;
   this.haloYCenter = this.originalView.image.height/2;
   this.haloCenter = new Point( this.haloXCenter, this.haloYCenter );
   this.Radius = this.originalView.image.height-10;

   this.fullViewpoints = window.previewRect(this.originalView);

   this.fullView= new ImageWindow(this.originalView.image.width,
                                 this.originalView.image.height,
                                 this.originalView.image.numberOfChannels,
                                 window.bitsPerSample,
                                 window.isFloatSample,
                                 this.originalView.image.colorSpace != ColorSpace_Gray,
                                 "fullView");

   this.fullView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.fullView.mainView.image.assign( window.mainView.image );
   this.fullView.mainView.endProcess();

   this.targetView= new ImageWindow(this.originalView.image.width,
                                 this.originalView.image.height,
                                 this.originalView.image.numberOfChannels,
                                 window.bitsPerSample,
                                 window.isFloatSample,
                                 this.originalView.image.colorSpace != ColorSpace_Gray,
                                 "targetView");

   this.targetView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.targetView.mainView.image.assign( this.originalView.image );
   this.targetView.mainView.endProcess();

   this.auxView= new ImageWindow(this.originalView.image.width,
                                 this.originalView.image.height,
                                 this.originalView.image.numberOfChannels,
                                 window.bitsPerSample,
                                 window.isFloatSample,
                                 this.originalView.image.colorSpace != ColorSpace_Gray,
                                 "auxView");

   this.auxView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.auxView.mainView.image.assign( this.originalView.image );
   this.auxView.mainView.endProcess();

   this.finalStarMask = new ImageWindow(this.originalView.image.width,
                                 this.originalView.image.height,
                                 1,
                                 window.bitsPerSample,
                                 window.isFloatSample,
                                 false,
                                 "FinalMask");

   this.finalStarMask.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.finalStarMask.mainView.image.fill( 0 );
   this.finalStarMask.mainView.image.blend( ArtificialMask(
                                                   this.originalView.image.width,
                                                   this.originalView.image.height,
                                                   this.starCenter,
                                                   this.starRadius,
                                                   0xffffffff, 0xffffffff));
   this.finalStarMask.mainView.endProcess();

   this.abort = false;
   this.busy = false;
   this.terminate = false;

   this.image = new Image;
   this.image.assign( this.originalView.image );
}

function MyDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.StarHaloReducer = function()
   {
      data.targetView.undoAll();
      data.targetView.purge();
      data.finalStarMask.undoAll();
      data.finalStarMask.purge();

      data.starCenter = new Point( data.starXCenter, data.starYCenter );
      data.haloCenter = new Point( data.haloXCenter, data.haloYCenter );

      processEvents();
      if ( data.abort )
         return;

      //creating the mask

      data.finalStarMask.mainView.beginProcess(UndoFlag_NoSwapFile);
      data.finalStarMask.mainView.image.fill( 0 );
      data.finalStarMask.mainView.image.blend( ArtificialMask(
                                                data.originalView.image.width,
                                                data.originalView.image.height,
                                                data.haloCenter,
                                                data.starHaloRadius,
                                                0xffffffff, 0xffffffff));
      data.finalStarMask.mainView.endProcess();

      if (data.softenHaloEdges.checked)
      {
         var p = new ATrousWaveletTransform;
         with ( p )
         {
            layers = // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [
            [true, true, -1.000, false, 3.000, 0.50, 1],
            [true, true, -1.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1]];
            scaleDelta = 0;
            scalingFunctionData = [
               0.292893,0.5,0.292893,
               0.5,1,0.5,
               0.292893,0.5,0.292893];
            scalingFunctionKernelSize = 3;
            scalingFunctionNoiseSigma = [
               0.8095,0.2688,0.1176,
               0.0568,0.0283,0.0141,
               0.0071,0.0036,0.0018,
               0.0009];
            scalingFunctionNoiseLayers = 10;
            scalingFunctionName = "3x3 Linear Interpolation";
            largeScaleFunction = NoFunction;
            curveBreakPoint = 0.75;
            noiseThresholding = false;
            noiseThresholdingAmount = 1.00;
            noiseThreshold = 3.00;
            softThresholding = true;
            useMultiresolutionSupport = false;
            deringing = false;
            deringingDark = 0.1000;
            deringingBright = 0.0000;
            outputDeringingMaps = false;
            lowRange = 0.0000;
            highRange = 0.0000;
            previewMode = Disabled;
            previewLayer = 0;
            toLuminance = true;
            toChrominance = true;
            linear = false;
         }

         p.executeOn(data.finalStarMask.mainView, false); // no swap file
      }

      // end create finalMask

      processEvents();
      if ( data.abort )
         return;

      data.targetView.mainView.beginProcess(UndoFlag_NoSwapFile);
      data.targetView.mainView.image.assign( data.originalView.image );
      data.targetView.mainView.endProcess();

      // Masking targetView

      data.targetView.maskVisible = true;
      data.targetView.maskInverted = false;
      data.targetView.mask = data.finalStarMask;

      // LRGB reducing halo

      var p = new HistogramTransformation;
      with ( p )
      {
         H = // c0, m, c1, r0, r1
         [
         [0.00000000, data.targetR, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, data.targetG, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, data.targetB, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, data.targetL, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.500000000, 1.00000000, 0.00000000, 1.00000000]];
      }
      p.executeOn(data.targetView.mainView, false); // no swap file

      // End LRGB reducing halo

      processEvents();
      if ( data.abort )
         return;

      // Recuperating background

      //creating Mask
      data.finalStarMask.mainView.beginProcess(UndoFlag_NoSwapFile);
      data.finalStarMask.mainView.image.fill( 0 );
      data.finalStarMask.mainView.image.blend( ArtificialMask(
                                                   data.originalView.image.width,
                                                   data.originalView.image.height,
                                                   data.haloCenter,
                                                   data.haloMaskRadius,
                                                   0xffffffff, 0xffffffff));
      data.finalStarMask.mainView.endProcess();

      processEvents();
      if ( data.abort )
         return;

      //restoring Background
      if (data.softenBorderEdges){
         var p = new ATrousWaveletTransform;
         with ( p )
         {
            layers = // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [
            [true, true, -1.000, false, 3.000, 0.50, 1],
            [true, true, -1.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1]];
            scaleDelta = 0;
            scalingFunctionData = [
               0.292893,0.5,0.292893,
               0.5,1,0.5,
               0.292893,0.5,0.292893];
            scalingFunctionKernelSize = 3;
            scalingFunctionNoiseSigma = [
               0.8095,0.2688,0.1176,
               0.0568,0.0283,0.0141,
               0.0071,0.0036,0.0018,
               0.0009];
            scalingFunctionNoiseLayers = 10;
            scalingFunctionName = "3x3 Linear Interpolation";
            largeScaleFunction = NoFunction;
            curveBreakPoint = 0.75;
            noiseThresholding = false;
            noiseThresholdingAmount = 1.00;
            noiseThreshold = 3.00;
            softThresholding = true;
            useMultiresolutionSupport = false;
            deringing = false;
            deringingDark = 0.1000;
            deringingBright = 0.0000;
            outputDeringingMaps = false;
            lowRange = 0.0000;
            highRange = 0.0000;
            previewMode = Disabled;
            previewLayer = 0;
            toLuminance = true;
            toChrominance = true;
            linear = false;
         }

         p.executeOn(data.finalStarMask.mainView, false); // no swap file
      }

      processEvents();
      if ( data.abort )
         return;

      var p = new PixelMath;
      with ( p )
      {
         expression = "auxView";
         expression1 = "";
         expression2 = "";
         expression3 = "";
         useSingleExpression = true;
         symbols = "";
         use64BitWorkingImage = false;
         rescale = false;
         rescaleLower = 0.0000000000;
         rescaleUpper = 1.0000000000;
         truncate = true;
         truncateLower = 0.0000000000;
         truncateUpper = 1.0000000000;
         createNewImage = false;
         newImageId = "";
         newImageWidth = 0;
         newImageHeight = 0;
         newImageAlpha = false;
         newImageColorSpace = SameAsTarget;
         newImageSampleFormat = SameAsTarget;
      }

      data.targetView.maskVisible = true;
      data.targetView.maskInverted = true;
      data.targetView.mask = data.finalStarMask;

      p.executeOn(data.targetView.mainView, false); // no swap file

      processEvents();
      if ( data.abort )
         return;

      // Rescue Small Scales

      if (data.smallScaleProtection){
         data.finalStarMask.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.finalStarMask.mainView.image.fill( 0 );
         data.finalStarMask.mainView.image.blend( ArtificialMask(
                                                      data.originalView.image.width,
                                                      data.originalView.image.height,
                                                      data.haloCenter,
                                                      data.smallScaleProtectedRadius,
                                                      0xffffffff, 0xffffffff));
         data.finalStarMask.mainView.endProcess();

         if (data.softenBorderEdges){
            var p = new ATrousWaveletTransform;
            with ( p )
            {
               layers = // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
               [
               [true, true, -1.000, false, 3.000, 0.50, 1],
               [true, true, -1.000, false, 3.000, 0.50, 1],
               [true, true, 0.000, false, 3.000, 0.50, 1],
               [true, true, 0.000, false, 3.000, 0.50, 1],
               [true, true, 0.000, false, 3.000, 0.50, 1]];
               scaleDelta = 0;
               scalingFunctionData = [
                  0.292893,0.5,0.292893,
                  0.5,1,0.5,
                  0.292893,0.5,0.292893];
               scalingFunctionKernelSize = 3;
               scalingFunctionNoiseSigma = [
                  0.8095,0.2688,0.1176,
                  0.0568,0.0283,0.0141,
                  0.0071,0.0036,0.0018,
                  0.0009];
               scalingFunctionNoiseLayers = 10;
               scalingFunctionName = "3x3 Linear Interpolation";
               largeScaleFunction = NoFunction;
               curveBreakPoint = 0.75;
               noiseThresholding = false;
               noiseThresholdingAmount = 1.00;
               noiseThreshold = 3.00;
               softThresholding = true;
               useMultiresolutionSupport = false;
               deringing = false;
               deringingDark = 0.1000;
               deringingBright = 0.0000;
               outputDeringingMaps = false;
               lowRange = 0.0000;
               highRange = 0.0000;
               previewMode = Disabled;
               previewLayer = 0;
               toLuminance = true;
               toChrominance = true;
               linear = false;
            }

            p.executeOn(data.finalStarMask.mainView, false); // no swap file
         }

         var p = new ATrousWaveletTransform;
         with ( p )
         {
            layers = // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [
            [true, true, 0.005, false, 3.000, 0.50, 1],
            [false, true, 0.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1],
            [true, true, 0.000, false, 3.000, 0.50, 1]];
            scaleDelta = 0;
            scalingFunctionData = [
               0.292893,0.5,0.292893,
               0.5,1,0.5,
               0.292893,0.5,0.292893];
            scalingFunctionKernelSize = 3;
            scalingFunctionNoiseSigma = [
               0.8095,0.2688,0.1176,
               0.0568,0.0283,0.0141,
               0.0071,0.0036,0.0018,
               0.0009];
            scalingFunctionNoiseLayers = 10;
            scalingFunctionName = "3x3 Linear Interpolation";
            largeScaleFunction = NoFunction;
            curveBreakPoint = 0.75;
            noiseThresholding = false;
            noiseThresholdingAmount = 1.00;
            noiseThreshold = 3.00;
            softThresholding = true;
            useMultiresolutionSupport = false;
            deringing = true;
            deringingDark = 0.1000;
            deringingBright = 0.0000;
            outputDeringingMaps = false;
            lowRange = 0.0000;
            highRange = 0.0000;
            previewMode = Disabled;
            previewLayer = 0;
            toLuminance = true;
            toChrominance = true;
            linear = false;
         }

         data.targetView.maskInverted = false;
         data.targetView.mask = data.finalStarMask;

         p.executeOn(data.targetView.mainView, false); // no swap file
      }

      processEvents();
      if ( data.abort )
         return;

      // Recuperating star

      //creating the mask

      data.finalStarMask.mainView.beginProcess(UndoFlag_NoSwapFile);
      data.finalStarMask.mainView.image.fill( 0 );
      data.finalStarMask.mainView.image.blend( ArtificialMask(
                                                   data.originalView.image.width,
                                                   data.originalView.image.height,
                                                   data.starCenter,
                                                   data.starProtectedRadius,
                                                   0xffffffff, 0xff000000));
      data.finalStarMask.mainView.endProcess();

      processEvents();
      if ( data.abort )
         return;

      var p = new PixelMath;
      with ( p )
      {
         expression = "auxView";
         expression1 = "";
         expression2 = "";
         expression3 = "";
         useSingleExpression = true;
         symbols = "";
         use64BitWorkingImage = false;
         rescale = false;
         rescaleLower = 0.0000000000;
         rescaleUpper = 1.0000000000;
         truncate = true;
         truncateLower = 0.0000000000;
         truncateUpper = 1.0000000000;
         createNewImage = false;
         newImageId = "";
         newImageWidth = 0;
         newImageHeight = 0;
         newImageAlpha = false;
         newImageColorSpace = SameAsTarget;
         newImageSampleFormat = SameAsTarget;
      }

      // Masking targetView

      data.targetView.maskVisible = true;
      data.targetView.maskInverted = false;
      data.targetView.mask = data.finalStarMask;

      p.executeOn(data.targetView.mainView, false); // no swap file

      // End recuperating star

      processEvents();
      if ( data.abort )
         return;

      // Copy our working data to the image
      data.image.apply( data.targetView.mainView.image );

      this.myScrollBox.bmp.selectedPoint = new Point(data.fullViewpoints.x0,data.fullViewpoints.y0);

      data.fullView.mainView.beginProcess(UndoFlag_NoSwapFile);
      this.myScrollBox.bmp.apply(data.targetView.mainView.image);
      this.myScrollBox.viewport.update();
      data.fullView.mainView.endProcess();
   };

   //
   // Asynchronous generation routine.
   //
   this.generate = function()
   {
      // If we are already generating data, request job abortion and return.
      if ( data.busy )
      {
         data.abort = true;
         return;
      }

      // Start of job
      data.busy = true;
      this.infoLabel.text = format( "Computing...");

      do
      {
         data.abort = false;
         data.image.assign( data.originalView.image );
         this.StarHaloReducer( data.image );
      }
      while ( data.abort && !data.terminate );

      // End of job
      data.busy = false;
      this.infoLabel.text = "Ready.";
   };

   var labelWidth1 = this.font.width( "Border Protection Value:" + 'T' );

   // ----- BUTTONS

   this.newInstance_Button = new ToolButton( this );
   with ( this.newInstance_Button )
   {
      icon = this.scaledResource( ":/process-interface/new-instance.png" );
      toolTip = "New Instance";

      onMousePress = function()
      {
         this.hasFocus = true;
         this.pushed = false;

         if (data.busy)
            (new MessageBox( "Process still running - please wait.",
                             TITLE, StdIcon_Error, StdButton_Ok )).execute();
         else
            with ( this.dialog )
            {
               /*
                * Export parameters and generate a new instance
                */
               data.exportParameters();
               newInstance();
            }
      };
   }

   this.ok_Button = new PushButton (this);
   with ( this.ok_Button )
   {
      text = "OK";

      // Do it
      onClick = function() {
         if (data.busy)
            (new MessageBox( "Process still running - please wait.",
                             TITLE, StdIcon_Error, StdButton_Ok )).execute();
         else{
            data.finalStarMask.forceClose();
            data.targetView.forceClose();
            data.auxView.forceClose();

            data.fullView.createPreview (data.fullViewpoints,data.originalView.id);
            data.fullView.show();
            data.fullView.zoomToOptimalFit();

            this.dialog.ok();
         }
      };
   }

   this.cancel_Button = new PushButton (this);
   with ( this.cancel_Button )
   {
      text = "Cancel";

      onClick = function() {
         data.abort = data.terminate = true;
         while ( data.busy ) {}

         data.finalStarMask.forceClose();
         data.targetView.forceClose();
         data.fullView.forceClose();
         data.auxView.forceClose();

         this.dialog.cancel();
      };
   }

   this.targetRControl = new NumericControl( this );
   with ( this.targetRControl )
   {
      setRange( 0.0, 0.9999 );
      label.text = "Red channel:";
      label.minWidth = labelWidth1;
      slider.setRange( 0, 100 );
      slider.scaledMinWidth = 400;
      setValue( data.targetR);
      setPrecision (3);
      toolTip = "<p>Halo correction balance, red channel.</p>";

      onValueUpdated = function( value )
      {
         data.targetR = value;
         this.dialog.generate();
      };
   }

   this.targetGControl = new NumericControl( this );
   with ( this.targetGControl )
   {
      setRange( 0.0, 0.9999 );
      label.text = "Green channel:";
      label.minWidth = labelWidth1;
      slider.setRange( 0, 100 );
      slider.scaledMinWidth = 400;
      setValue( data.targetG);
      setPrecision (3);
      toolTip = "<p>Halo correction balance, green channel.</p>";

      onValueUpdated = function( value )
      {
         data.targetG = value;
         this.dialog.generate();
      };
   }

   this.targetBControl = new NumericControl( this );
   with ( this.targetBControl )
   {
      setRange( 0.0, 0.9999 );
      label.text = "Blue channel:";
      label.minWidth = labelWidth1;
      slider.setRange( 0, 100 );
      slider.scaledMinWidth = 400;
      setValue( data.targetB);
      setPrecision (3);
      toolTip = "<p>Halo correction balance, blue channel.</p>";

      onValueUpdated = function( value )
      {
         data.targetB = value;
         this.dialog.generate();
      };
   }

   this.targetLControl = new NumericControl( this );
   with ( this.targetLControl )
   {
      setRange( 0.0, 0.9999 );
      label.text = "RGB/K:";
      label.minWidth = labelWidth1;
      slider.setRange( 0, 100 );
      slider.scaledMinWidth = 400;
      setValue( data.targetL );
      setPrecision (3);
      toolTip = "<p>Halo correction balance, combined RGB/K channel.</p>";

      onValueUpdated = function( value )
      {
         data.targetL = value;
         this.dialog.generate();
      };
   }


   this.auxMaskLControl = new NumericControl( this );
   with ( this.auxMaskLControl )
   {
      real = false;
      setRange( 1, 10+data.originalView.image.width/2 );
      label.text = "Halo reduction radius:";
      label.minWidth = labelWidth1;
      slider.setRange( 1, 10+data.originalView.image.width/2 );
      slider.scaledMinWidth = 400;
      setValue( data.haloMaskRadius );
      toolTip = "<p>This parameter controls the size of the halo reduction mask.</p>";

      onValueUpdated = function( value )
      {
         data.haloMaskRadius = value;
         this.dialog.generate();
      };
   }

   this.myScrollBox = new MyTabPageControl( this );

   this.starCenterXLabel = new Label( this );
   with ( this.starCenterXLabel )
   {
      minWidth = labelWidth1;
      text = "Star center X:";
      toolTip = "<p>Horizontal position of the center of the star, in preview coordinates.</p>";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
   }

   this.starCenterXSpinBox = new SpinBox( this );
   with ( this.starCenterXSpinBox )
   {
      minValue = 0;
      maxValue = data.originalView.image.width;
      value = data.starXCenter;
      toolTip = "<p>Horizontal position of the center of the star, in preview coordinates.</p>";

      onValueUpdated = function( value )
      {
         data.starXCenter = value;
         this.dialog.generate();
      };
   }

   this.starCenterYLabel = new Label( this );
   with ( this.starCenterYLabel )
   {
      minWidth = labelWidth1;
      text = "Star center Y:";
      toolTip = "<p>Vertical position of the center of the star, in preview coordinates.</p>";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
   }

   this.starCenterYSpinBox = new SpinBox( this );
   with ( this.starCenterYSpinBox )
   {
      minValue = 0;
      maxValue = data.originalView.image.height;
      value = data.starYCenter;
      toolTip = "<p>Vertical position of the center of the star, in preview coordinates.</p>";

      onValueUpdated = function( value )
      {
         data.starYCenter = value;
         this.dialog.generate();
      };
   }

   this.starCenterXYcoord = new HorizontalSizer;
   with ( this.starCenterXYcoord )
   {
      spacing = 4;
      add( this.starCenterXLabel );
      add( this.starCenterXSpinBox );
      add( this.starCenterYLabel );
      add( this.starCenterYSpinBox );
      addStretch();
   }

   this.starprotectedRadiusControl = new NumericControl( this );
   with ( this.starprotectedRadiusControl )
   {
      real = false;
      setRange( 0, 200 );
      label.text = "Star protection radius:";
      label.minWidth = labelWidth1;
      slider.setRange( 0, 200 );
      slider.scaledMinWidth = 400;
      setValue( data.starProtectedRadius );
      toolTip = "<p>Radius of a protection mask to prevent overcorrection on central star regions.</p>";

      onValueUpdated = function( value )
      {
         data.starProtectedRadius = value;
         this.dialog.generate();
      };
   }

   this.haloCenterXLabel = new Label( this );
   with ( this.haloCenterXLabel )
   {
      minWidth = labelWidth1;
      text = "Star halo center X:";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      toolTip = "<p>Horizontal position of the center of the halo, in preview coordinates.</p>";
   }

   this.haloCenterXSpinBox = new SpinBox( this );
   with ( this.haloCenterXSpinBox )
   {
      minValue = 0;
      maxValue = data.originalView.image.width;
      value = data.haloXCenter;
      toolTip = "<p>Horizontal position of the center of the halo, in preview coordinates.</p>";

      onValueUpdated = function( value )
      {
         data.haloXCenter = value;
         this.dialog.generate();
      };
   }

   this.haloCenterYLabel = new Label( this );
   with ( this.haloCenterYLabel )
   {
      minWidth = labelWidth1;
      text = "Star halo center Y:";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      toolTip = "<p>Vertical position of the center of the halo, in preview coordinates.</p>";
   }

   this.haloCenterYSpinBox = new SpinBox( this );
   with ( this.haloCenterYSpinBox )
   {
      minValue = 0;
      maxValue = data.originalView.image.height;
      value = data.haloYCenter;
      toolTip = "<p>Vertical position of the center of the halo, in preview coordinates.</p>";

      onValueUpdated = function( value )
      {
         data.haloYCenter = value;
         this.dialog.generate();
      };
   }

   this.haloCenterXYcoord = new HorizontalSizer;
   with ( this.haloCenterXYcoord )
   {
      spacing = 4;
      add( this.haloCenterXLabel );
      add( this.haloCenterXSpinBox );
      add( this.haloCenterYLabel );
      add( this.haloCenterYSpinBox );
      addStretch();
   }

  this.starhaloRadiusControl = new NumericControl( this );
   with ( this.starhaloRadiusControl )
   {
      real = false;
      setRange( 0, 200 );
      label.text = "Star halo radius:";
      label.minWidth = labelWidth1;
      slider.setRange( 0, 200 );
      slider.scaledMinWidth = 400;
      setValue( data.starHaloRadius);
      toolTip = "<p>Specifies an estimate of the size of the halo artifact.</p>";

      onValueUpdated = function( value )
      {
         data.starHaloRadius = value;
         this.dialog.generate();
      };
   }

   this.softenHaloEdges_CheckBox = new CheckBox( this );
   with ( this.softenHaloEdges_CheckBox )
   {
      text = "Soft halo mask edges";
      checked = data.softenHaloEdges;
      toolTip = "<p>Enable to apply a low-pass filtering process to the halo correction mask.</p>";
      onCheck = function( checked )
      {
         data.softenHaloEdges = checked;
         this.dialog.generate();
      };
   }

   this.softenBorderEdges_CheckBox = new CheckBox( this );
   with ( this.softenBorderEdges_CheckBox )
   {
      text = "Soft border mask edges";
      checked = data.softenBorderEdges;
      toolTip = "<p>Enable to apply a low-pass filtering process to the border protection mask.</p>";

      onCheck = function( checked )
      {
         data.softenBorderEdges = checked;
         this.dialog.generate();
      };
   }

   this.artificialMaskShape = new HorizontalSizer;
   with ( this.artificialMaskShape)
   {
      margin = 0;
      spacing = 4;
      add( this.softenHaloEdges_CheckBox );
      add( this.softenBorderEdges_CheckBox );
   }

   this.smallScaleProtection_CheckBox = new CheckBox( this );
   with ( this.smallScaleProtection_CheckBox )
   {
      text = "Small-scale protection";
      checked = data.smallScaleProtection;
      toolTip = "<p>Enable this option to apply a wavelet-based, edge-enhancement process to " +
                "recover small-scale detail on the corrected region.</p>";

      onCheck = function( checked )
      {
         data.smallScaleProtection = checked;
         this.dialog.generate();
      };
   }

   this.smallScalesprotectedRadiusControl = new NumericControl( this );
   with ( this.smallScalesprotectedRadiusControl )
   {
      real = false;
      setRange( 0, 200 );
      label.text = "Small-scale protection amount:";
      label.minWidth = labelWidth1;
      slider.setRange( 0, 200 );
      slider.scaledMinWidth = 400;
      setValue( data.smallScaleProtectedRadius);
      toolTip = "<p>Intensity of the small-scale protection procedure.</p>";

      onValueUpdated = function( value )
      {
         data.smallScaleProtectedRadius = value;
         this.dialog.generate();
      };
   }

   this.smallScalesGroupBox = new GroupBox( this );
   this.smallScalesGroupBox.title = "Small-Scale Protection";
   this.smallScalesGroupBox.sizer = new VerticalSizer;
   with ( this.smallScalesGroupBox.sizer )
   {
      margin = 6;
      spacing = 4;
      addStretch();
      add( this.smallScaleProtection_CheckBox );
      add( this.smallScalesprotectedRadiusControl );
   }

   this.artificialStarMaskGroupBox = new GroupBox( this );
   this.artificialStarMaskGroupBox.title = "Star Mask";
   this.artificialStarMaskGroupBox.sizer = new VerticalSizer;
   with ( this.artificialStarMaskGroupBox.sizer )
   {
      margin = 6;
      spacing = 2;
      addStretch();
      add( this.auxMaskLControl );
      add (this.starCenterXYcoord);
      add (this.starprotectedRadiusControl);
      addSpacing (2);
      add (this.haloCenterXYcoord);
      add (this.starhaloRadiusControl);
      add (this.artificialMaskShape);
   }

   this.starhaloGroupBox = new GroupBox( this );
   this.starhaloGroupBox.title = "Halo Reduction";
   this.starhaloGroupBox.sizer = new VerticalSizer;
   with ( this.starhaloGroupBox.sizer )
   {
      margin = 6;
      spacing = 4;
      addStretch();
      add( this.targetLControl );
      add( this.targetRControl );
      add( this.targetGControl );
      add( this.targetBControl );
   }

   this.infoLabel = new Label( this );
   with ( this.infoLabel )
   {
      scaledMinWidth = 450;
      frameStyle = FrameStyle_Box;
      margin = 4;
      text = "Ready.";
   }

   this.apply_Button = new PushButton ( this );
   with ( this.apply_Button )
   {
      text = "Apply changes and continue";

      onClick = function() {
         data.auxView.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.auxView.mainView.image.apply(data.image);
         data.auxView.mainView.endProcess();
         data.targetView.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.targetView.mainView.image.assign( data.image );
         data.targetView.mainView.endProcess();
         this.dialog.generate();
      };
   }

   this.buttons_Sizer = new HorizontalSizer;
   with ( this.buttons_Sizer )
   {
      spacing = 4;
      add (this.newInstance_Button);
      addStretch();
      add (this.infoLabel);
      add (this.cancel_Button);
      add (this.ok_Button);
   }

   this.sizer = new VerticalSizer;
   with ( this.sizer )
   {
      margin = 6;
      spacing = 6;
      addStretch();
      add(this.myScrollBox, 100);
      addSpacing (4);
      add(this.starhaloGroupBox );
      add(this.artificialStarMaskGroupBox);
      add(this.smallScalesGroupBox);
      add(this.apply_Button);
      addSpacing (4);
      add (this.buttons_Sizer);
   }

   // Ensure first-time generation
   this.onGetFocus = function()
   {
      this.generate();
   }

   // Ensure unconditional job abortion upon dialog termination
   this.onHide = function()
   {
      data.terminate = data.abort = true;
      while ( data.busy ) {}
   }

   this.userResizable=false;
   this.windowTitle = TITLE + "Script v" + VERSION;
   this.adjustToContents();
}

MyDialog.prototype = new Dialog;

function MyTabPageControl( parent )
{
   this.__base__ = ScrollBox;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.bmp = data.fullView.mainView.image;
   this.bmp.selectedPoint = new Point(data.fullViewpoints.x0,data.fullViewpoints.y0);
   data.fullView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.bmp.apply(data.image);
   data.fullView.mainView.endProcess();
   this.fullView=data.fullView;
   this.autoScroll = true;
   this.tracking = true;
   this.setScaledMinSize(600,150);

   this.dragging = false;
   this.dragOrigin = new Point( 0 );

   this.viewport.cursor = new Cursor( StdCursor_OpenHand );

   this.initScrollBars = function()
   {
      this.pageWidth = this.bmp.width;
      this.pageHeight = this.bmp.height;
      this.setHorizontalScrollRange( 0, Math.max( 0, this.bmp.width - this.viewport.width ) );
      this.setVerticalScrollRange( 0, Math.max( 0, this.bmp.height - this.viewport.height ) );
      this.setScrollPosition(
               data.fullViewpoints.x0 + data.targetView.mainView.image.width/2 - this.viewport.width/2,
               data.fullViewpoints.y0 + data.targetView.mainView.image.height/2 - this.viewport.height/2 );
      this.viewport.update();
   };

   this.viewport.onResize = function()
   {
      this.parent.initScrollBars();
   };

   this.onHorizontalScrollPosUpdated = function( x )
   {
      this.viewport.update();
   };

   this.onVerticalScrollPosUpdated = function( y )
   {
      this.viewport.update();
   };

   this.viewport.onMousePress = function( x, y, button, buttons, modifiers )
   {
      this.cursor = new Cursor( StdCursor_ClosedHand );
      with ( this.parent )
      {
         dragOrigin.x = x;
         dragOrigin.y = y;
         dragging = true;
      }
   };

   this.viewport.onMouseMove = function( x, y, buttons, modifiers )
   {
      with ( this.parent )
      {
         if ( dragging )
         {
            scrollPosition = new Point( scrollPosition ).translatedBy( dragOrigin.x-x, dragOrigin.y-y );
            dragOrigin.x = x;
            dragOrigin.y = y;
         }
      }
   };

   this.viewport.onMouseRelease = function( x, y, button, buttons, modifiers )
   {
      this.cursor = new Cursor( StdCursor_OpenHand );
      this.parent.dragging = false;
   };

   this.viewport.onPaint = function( x0, y0, x1, y1 )
   {
      var g = new Graphics( this );
      //g.fillRect( x0, y0, x1, y1, new Brush( 0xff000000 ) );
      this.parent.bmp.selectedRect = (new Rect( x0, y0, x1, y1 )).translated( this.parent.scrollPosition );
      g.drawBitmap( x0, y0, this.parent.bmp.render() );
      this.parent.bmp.resetRectSelection();
      g.end();
   };

   this.initScrollBars();
}

MyTabPageControl.prototype = new ScrollBox;

function ArtificialMask(width,height,center,radius,color1,color2)
{
   // Working bitmap

   var AMaskbmp = new Bitmap( width, height );
   AMaskbmp.fill(0x00000000);

   // Create a graphics context to draw on our working bitmap
   var g = new Graphics( AMaskbmp );

   // We want high-quality antialiased graphics
   g.antialiasing = true;

   // Define working objects
   g.pen = new Pen( 0x00000000 );
   g.brush = new RadialGradientBrush( center, radius, center, [[0, color1], [1, color2]] );

   // Draw this planet
   g.drawCircle( center, radius );
   g.end();

   return AMaskbmp;
}

var window = ImageWindow.activeWindow;
var data = new StarHaloReducerData;

function main()
{
   if ( !data.originalView || data.originalView.isNull )
      return;

   console.hide();
   (new MyDialog).execute();
}

main();
