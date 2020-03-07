/*
 * ### FIXME ###
 *
 * PTeam revision - 2013 December 05 - This script has been revised to keep it
 * running on version 1.8.0 of PixInsight.
 *
 * - The code needs refactoring, especially to get rid of with{} constructs.
 *
 * - Several UI bugs still have to be fixed.
 *
 * - This script lacks a software license - unlicensed code cannot be part of
 *   an official PixInsight release.
 */

#feature-id    Utilities > NBRGBCombination

#feature-info  Script to combine any narrowband image (Ha,O3 etc) with RGB \
               originaly made by Silvercup \
            heavily modified by roryt (Ioannis Ioannou) \
            see http://pixinsight.com/forum/index.php?topic=3446.0

#feature-icon  NBRGBCombination.xpm

// Version 1.7  2013-11-30 roryt (Ioannis Ioannou)

#include <pjsr/ColorSpace.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/FontFamily.jsh>
#include <pjsr/SampleType.jsh>

// Largest dimension of the image preview in pixels.
#define PREVIEW_SIZE 400

// Shadows clipping point in (normalized) MAD units from the median.
#define SHADOWS_CLIP -2.80
// Target mean background in the [0,1] range.
#define TARGET_BKG    0.25

// Whether to apply the same STF to all channels, or treat each channel separately.
// roryt, made this a parameter data.CSTF_Linked not a hardcoded define #define RGB_LINK      true

// names for the temporary views
#define R_NAME                "NBRGBCombination_R"
#define G_NAME                "NBRGBCombination_G"
#define B_NAME                "NBRGBCombination_B"
#define NBr_NAME              "NBRGBCombination_NBr"
#define NBg_NAME              "NBRGBCombination_NBg"
#define NBb_NAME              "NBRGBCombination_NBb"
#define NBRGBCombination_NAME "NBRGBCombination"
#define Preview_NAME          "NBRGBCombination_Preview"

function NBRGBCombinationData()	{
   this.RGBView= ImageWindow.activeWindow.mainView;
   if ( this.RGBView.isNull ) {
      var msg = new MessageBox( "You must select an RGB view to apply this script.", "NBRGB Combination Script", StdIcon_Error, StdButton_Ok );
      console.hide();
      msg.execute();
      throw new Error( "You must select an RGB view to apply this script." );
   }

   this.Preview= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 3,
                                 32,
                                 true,
                                 true,
                                 Preview_NAME);

   this.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.Preview.mainView.image.fill( 0 );
   this.Preview.mainView.endProcess();
   this.Preview.zoomFactor=12;
   this.Preview.fitWindow();
   this.Preview.zoomToOptimalFit();
   this.Preview.show();


   this.NBRGBView= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 3,
                                 32,
                                 true,
                                 true,
                                 NBRGBCombination_NAME);

   this.NBRGBView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.NBRGBView.mainView.image.fill( 0 );
   this.NBRGBView.mainView.endProcess();
   this.NBRGBView.zoomFactor=12;
   this.NBRGBView.fitWindow();
   this.NBRGBView.zoomToOptimalFit();


   this.NBrView= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 1,
                                 32,
                                 true,
                                 false, /* ### */
                                 NBr_NAME);

   this.NBrView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.NBrView.mainView.image.fill( 0 );
   this.NBrView.mainView.endProcess();
   this.NBrView.zoomFactor=12;
   this.NBrView.fitWindow();
   this.NBrView.zoomToOptimalFit();

   this.NBgView= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 1,
                                 32,
                                 true,
                                 false, /* ### */
                                 NBg_NAME);

   this.NBgView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.NBgView.mainView.image.fill( 0 );
   this.NBgView.mainView.endProcess();
   this.NBgView.zoomFactor=12;
   this.NBgView.fitWindow();
   this.NBgView.zoomToOptimalFit();

   this.NBbView= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 1,
                                 32,
                                 true,
                                 false, /* ### */
                                 NBb_NAME);

   this.NBbView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.NBbView.mainView.image.fill( 0 );
   this.NBbView.mainView.endProcess();
   this.NBbView.zoomFactor=12;
   this.NBbView.fitWindow();
   this.NBbView.zoomToOptimalFit();


   this.RView= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 1,
                                 32,
                                 true,
                                 false,
                                 R_NAME);

   this.RView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.RView.mainView.image.fill( 0 );
   this.RView.mainView.endProcess();

   this.GView= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 1,
                                 32,
                                 true,
                                 false,
                                 G_NAME);
   this.GView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.GView.mainView.image.fill( 0 );
   this.GView.mainView.endProcess();

   this.BView= new ImageWindow(this.RGBView.image.width,
                                 this.RGBView.image.height,
                                 1,
                                 32,
                                 true,
                                 false,
                                 B_NAME);

   this.BView.mainView.beginProcess(UndoFlag_NoSwapFile);
   this.BView.mainView.image.fill( 0 );
   this.BView.mainView.endProcess();



   this.sourceNBrView=null;
   this.sourceNBrBandwidth=7;
   this.sourceNBrMultiplication=1.20;
   this.sourceNBgView=null;
   this.sourceNBgBandwidth=8.5;
   this.sourceNBgMultiplication=1.20;
   this.sourceNBbView=null;
   this.sourceNBbBandwidth=8.5;
   this.sourceNBbMultiplication=1.20;

   this.sourceRGBView=null;
   this.sourceRGBBandwidth=100;

   this.RGBImageSTF=null;
   this.NBRGBImageSTF=null;
   this.NBrImageSTF=null;
   this.NBgImageSTF=null;
   this.NBbImageSTF=null;

   this.CSTF=true;
   this.CSTF_Linked=false;

   this.Changed=true;

   this.CRescale=false;

   this.abort = false;
   this.busy = false;
   this.terminate = false;

}

function MyDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.onHide = function() {
      // onHide is called in any case that the Dialog closes, cleanup
      data.Preview.forceClose();
      data.RView.forceClose();
      data.GView.forceClose();
      data.BView.forceClose();
      data.NBrView.forceClose();
      data.NBgView.forceClose();
      data.NBbView.forceClose();
      if (! data.NBRGBView.isNull) { // null will be at Cancel
         data.NBRGBView.show();  // do not know if OK was pressed or the form was closed by [X], better show it than close it
      }
   };

   /*
    * STF Auto Stretch routine
    */
   this.ApplyAutoSTF = function( view, shadowsClipping, targetBackground, rgbLinked )
   {
      var stf = new ScreenTransferFunction;

      var n = view.image.isColor ? 3 : 1;

      var median = view.computeOrFetchProperty( "Median" );

      var mad = view.computeOrFetchProperty( "MAD" );
      mad.mul( 1.4826 ); // coherent with a normal distribution

      if ( rgbLinked )
      {
         /*
          * Try to find how many channels look as channels of an inverted image.
          * We know a channel has been inverted because the main histogram peak is
          * located over the right-hand half of the histogram. Seems simplistic
          * but this is consistent with astronomical images.
          */
         var invertedChannels = 0;
         for ( var c = 0; c < n; ++c )
            if ( median.at( c ) > 0.5 )
               ++invertedChannels;

         if ( invertedChannels < n )
         {
            /*
             * Noninverted image
             */
            var c0 = 0, m = 0;
            for ( var c = 0; c < n; ++c )
            {
               if ( 1 + mad.at( c ) != 1 )
                  c0 += median.at( c ) + shadowsClipping * mad.at( c );
               m  += median.at( c );
            }
            c0 = Math.range( c0/n, 0.0, 1.0 );
            m = Math.mtf( targetBackground, m/n - c0 );

            stf.STF = [ // c0, c1, m, r0, r1
                        [c0, 1, m, 0, 1],
                        [c0, 1, m, 0, 1],
                        [c0, 1, m, 0, 1],
                        [0, 1, 0.5, 0, 1] ];
         }
         else
         {
            /*
             * Inverted image
             */
            var c1 = 0, m = 0;
            for ( var c = 0; c < n; ++c )
            {
               m  += median.at( c );
               if ( 1 + mad.at( c ) != 1 )
                  c1 += median.at( c ) - shadowsClipping * mad.at( c );
               else
                  c1 += 1;
            }
            c1 = Math.range( c1/n, 0.0, 1.0 );
            m = Math.mtf( c1 - m/n, targetBackground );

            stf.STF = [ // c0, c1, m, r0, r1
                        [0, c1, m, 0, 1],
                        [0, c1, m, 0, 1],
                        [0, c1, m, 0, 1],
                        [0, 1, 0.5, 0, 1] ];
         }
      }
      else
      {
         /*
          * Unlinked RGB channnels: Compute automatic stretch functions for
          * individual RGB channels separately.
          */
         var A = [ // c0, c1, m, r0, r1
                  [0, 1, 0.5, 0, 1],
                  [0, 1, 0.5, 0, 1],
                  [0, 1, 0.5, 0, 1],
                  [0, 1, 0.5, 0, 1] ];

         for ( var c = 0; c < n; ++c )
         {
            if ( median.at( c ) < 0.5 )
            {
               /*
                * Noninverted channel
                */
               var c0 = (1 + mad.at( c ) != 1) ? Math.range( median.at( c ) + shadowsClipping * mad.at( c ), 0.0, 1.0 ) : 0.0;
               var m  = Math.mtf( targetBackground, median.at( c ) - c0 );
               A[c] = [c0, 1, m, 0, 1];
            }
            else
            {
               /*
                * Inverted channel
                */
               var c1 = (1 + mad.at( c ) != 1) ? Math.range( median.at( c ) - shadowsClipping * mad.at( c ), 0.0, 1.0 ) : 1.0;
               var m  = Math.mtf( c1 - median.at( c ), targetBackground );
               A[c] = [0, c1, m, 0, 1];
            }
         }

         stf.STF = A;
      }

      console.writeln( "<end><cbr/><br/><b>", view.fullId, "</b>:" );
      for ( var c = 0; c < n; ++c )
      {
         console.writeln( "channel #", c );
         console.writeln( format( "c0 = %.6f", stf.STF[c][0] ) );
         console.writeln( format( "m  = %.6f", stf.STF[c][2] ) );
         console.writeln( format( "c1 = %.6f", stf.STF[c][1] ) );
      }

      stf.executeOn( view );

      console.writeln( "<end><cbr/><br/>" );
   };

   this.applySTF=function( img, stf ) {
      var HT = new HistogramTransformation;
      if (img.isColor) {
         HT.H =	[	[stf[0][1], stf[0][0], stf[0][2], stf[0][3], stf[0][4]],
                  [stf[1][1], stf[1][0], stf[1][2], stf[1][3], stf[1][4]],
                  [stf[2][1], stf[2][0], stf[2][2], stf[2][3], stf[2][4]],
                  [ 0, 0.5, 1, 0, 1]
               ];
      } else {
         HT.H =	[	[ 0, 0.5, 1, 0, 1],
                  [ 0, 0.5, 1, 0, 1],
                  [ 0, 0.5, 1, 0, 1],
                  [stf[0][1], stf[0][0], stf[0][2], stf[0][3], stf[0][4]]
               ];
      }

      //console.writeln("R/K: ",  stf[0][0], ",", stf[0][1], ",", stf[0][2], ",", stf[0][3], ",", stf[0][4]);
      //console.writeln("G  : ",  stf[1][0], ",", stf[1][1], ",", stf[1][2], ",", stf[1][3], ",", stf[1][4]);
      //console.writeln("B  : ",  stf[2][0], ",", stf[2][1], ",", stf[2][2], ",", stf[2][3], ",", stf[2][4]);
      //console.writeln("L  : ",  stf[3][0], ",", stf[3][1], ",", stf[3][2], ",", stf[3][3], ",", stf[3][4]);
      //console.writeln("width: ", img.width, " height: ", img.height, " , channels: " , img.numberOfChannels, " , bitsperpixel: ", img.bitsPerSample, " , sample: ", img.sampleType, " ,is color: ", img.isColor);

      var wtmp = new ImageWindow( img.width, img.height, img.numberOfChannels, img.bitsPerSample, img.sampleType == SampleType_Real, img.isColor, "tmpSTFWindow" );
      var v = wtmp.mainView;
      v.beginProcess( UndoFlag_NoSwapFile );
      v.image.assign( img );
      v.endProcess();
      HT.executeOn( v, false ); // no swap file
      var image=v.image;
      var result=new Image(	image.width, image.height, image.numberOfChannels, image.colorSpace, image.bitsPerSample, image.sampleType);
      result.assign(v.image);
      wtmp.forceClose();
      return result;
   };

   this.Calculate_NBRGB = function() {

      if (data.Changed){
         console.show();

         //---------------------------------------------------
         var P = new PixelMath;
         // Ha = (Ha*RGB_bandwith-RGB*Ha_bandwith )/(RGB_bandwith-Ha_bandwith)
         P.expression = "";
         P.expression1 = "";
         P.expression2 = "";
         P.expression3 = "";
         P.useSingleExpression = true;
         P.symbols = "";
         P.use64BitWorkingImage = false;
         P.rescale = data.CRescale;
         P.rescaleLower = 0.0000000000;
         P.rescaleUpper = 1.0000000000;
         P.truncate = true;
         P.truncateLower = 0.0000000000;
         P.truncateUpper = 1.0000000000;
         P.createNewImage = false;
         P.newImageId = "";
         P.newImageWidth = 0;
         P.newImageHeight = 0;
         P.newImageAlpha = false;
         P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
         P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

         if (data.sourceNBrView != null) {
            P.expression = "(("+data.sourceNBrView.id+"*"+data.sourceRGBBandwidth+")-("+data.sourceRGBView.id+"*"+data.sourceNBrBandwidth+"))/("+data.sourceRGBBandwidth+"-"+data.sourceNBrBandwidth+")";
            data.NBrView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.NBrView.mainView);
            data.NBrView.mainView.endProcess();
            console.writeln("NBrView P.expression=",P.expression);
         }
         if (data.sourceNBgView != null) {
            P.expression = "(("+data.sourceNBgView.id+"*"+data.sourceRGBBandwidth+")-("+data.sourceRGBView.id+"*"+data.sourceNBgBandwidth+"))/("+data.sourceRGBBandwidth+"-"+data.sourceNBgBandwidth+")";
            data.NBgView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.NBgView.mainView);
            data.NBgView.mainView.endProcess();
            console.writeln("NBgView P.expression=",P.expression);
         }
         if (data.sourceNBbView != null) {
            P.expression = "(("+data.sourceNBbView.id+"*"+data.sourceRGBBandwidth+")-("+data.sourceRGBView.id+"*"+data.sourceNBbBandwidth+"))/("+data.sourceRGBBandwidth+"-"+data.sourceNBbBandwidth+")";
            data.NBbView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.NBbView.mainView);
            data.NBbView.mainView.endProcess();
            console.writeln("NBbView P.expression=",P.expression);
         }

         data.NBRGBView.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.NBRGBView.mainView.image.assign(data.sourceRGBView.image);
         data.NBRGBView.mainView.endProcess();
         // --------------------------------------------------------------------------
         var P = new PixelMath;
         // R=R+(Ha-med(Ha))*HaMultiplier
         P.expression = "";
         P.expression1 = "";
         P.expression2 = "";
         P.expression3 = "";
         P.useSingleExpression = true;
         P.symbols = "";
         P.use64BitWorkingImage = false;
         P.rescale = data.CRescale;
         P.rescaleLower = 0.0000000000;
         P.rescaleUpper = 1.0000000000;
         P.truncate = true;
         P.truncateLower = 0.0000000000;
         P.truncateUpper = 1.0000000000;
         P.createNewImage = false;
         P.newImageId = "";
         P.newImageWidth = 0;
         P.newImageHeight = 0;
         P.newImageAlpha = false;
         P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
         P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

         if (data.sourceNBrView != null) {
            P.expression = data.sourceRGBView.id+"[0]+("+NBr_NAME+"-med("+NBr_NAME+"))*"+data.sourceNBrMultiplication;
            data.RView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.RView.mainView);
            data.RView.mainView.endProcess();
            console.writeln("RView P.expression=",P.expression);
         }
         if (data.sourceNBgView != null) {
            P.expression = data.sourceRGBView.id+"[1]+("+NBg_NAME+"-med("+NBg_NAME+"))*"+data.sourceNBgMultiplication;
            data.GView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.GView.mainView);
            data.GView.mainView.endProcess();
            console.writeln("GView P.expression=",P.expression);
         }
         if (data.sourceNBbView != null) {
            P.expression = data.sourceRGBView.id+"[2]+("+NBb_NAME+"-med("+NBb_NAME+"))*"+data.sourceNBbMultiplication;
            data.BView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.BView.mainView);
            data.BView.mainView.endProcess();
            console.writeln("BView P.expression=",P.expression);
         }
         //-----------------------------------------------------
         // linearfit Ha with R
         var P = new LinearFit;
         P.rejectLow = 0.000000;
         P.rejectHigh = 0.920000;
         if (data.sourceNBrView != null) {
            P.referenceViewId = R_NAME;
            data.NBrView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.NBrView.mainView);
            data.NBrView.mainView.endProcess();
            console.writeln("Linear Fit NBrView with ",R_NAME);
         }
         if (data.sourceNBgView != null) {
            P.referenceViewId = G_NAME;
            data.NBgView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.NBgView.mainView);
            data.NBgView.mainView.endProcess();
            console.writeln("Linear Fit NBgView with ",G_NAME);
         }
         if (data.sourceNBbView != null) {
            P.referenceViewId = B_NAME;
            data.NBbView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.NBbView.mainView);
            data.NBbView.mainView.endProcess();
            console.writeln("Linear Fit NBbView with ",B_NAME);
         }
         //-------------------------------------------------------------------

         var P = new PixelMath;
         //max(Ha,R)
         P.expression1 = "";
         P.expression2 = "";
         P.expression3 = "";
         P.useSingleExpression = true;
         P.symbols = "";
         P.use64BitWorkingImage = false;
         P.rescale = data.CRescale;
         P.rescaleLower = 0.0000000000;
         P.rescaleUpper = 1.0000000000;
         P.truncate = true;
         P.truncateLower = 0.0000000000;
         P.truncateUpper = 1.0000000000;
         P.createNewImage = false;
         P.newImageId = "";
         P.newImageWidth = 0;
         P.newImageHeight = 0;
         P.newImageAlpha = false;
         P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
         P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;
         if (data.sourceNBrView != null) {
            P.expression = "max("+NBr_NAME+","+R_NAME+")";
            data.RView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.RView.mainView);
            data.RView.mainView.endProcess();
            console.writeln("RView P.expression=",P.expression);
         }
         if (data.sourceNBgView != null) {
            P.expression = "max("+NBg_NAME+","+G_NAME+")";
            data.GView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.GView.mainView);
            data.GView.mainView.endProcess();
            console.writeln("GView P.expression=",P.expression);
         }
         if (data.sourceNBbView != null) {
            P.expression = "max("+NBb_NAME+","+B_NAME+")";
            data.BView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.BView.mainView);
            data.BView.mainView.endProcess();
            console.writeln("BView P.expression=",P.expression);
         }
         //----------------------------------------------------

         var P = new PixelMath;
         // remaining R,G,or B

         P.expression1 = "";
         P.expression2 = "";
         P.expression3 = "";
         P.useSingleExpression = true;
         P.symbols = "";
         P.use64BitWorkingImage = false;
         P.rescale = false;
         P.rescaleLower = 0.0000000000;
         P.rescaleUpper = 1.0000000000;
         P.truncate = true;
         P.truncateLower = 0.0000000000;
         P.truncateUpper = 1.0000000000;
         P.createNewImage = false;
         P.newImageId = "";
         P.newImageWidth = 0;
         P.newImageHeight = 0;
         P.newImageAlpha = false;
         P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
         P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

         if (data.sourceNBrView == null) {
            P.expression = data.sourceRGBView.id+"[0]";
            data.RView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.RView.mainView);
            data.RView.mainView.endProcess();
            console.writeln("RView P.expression=",P.expression);
         }
         if (data.sourceNBgView == null) {
            P.expression = data.sourceRGBView.id+"[1]";
            data.GView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.GView.mainView);
            data.GView.mainView.endProcess();
            console.writeln("GView P.expression=",P.expression);
         }
         if (data.sourceNBbView == null) {
            P.expression = data.sourceRGBView.id+"[2]";
            data.BView.mainView.beginProcess(UndoFlag_NoSwapFile);
            P.executeOn(data.BView.mainView);
            data.BView.mainView.endProcess();
            console.writeln("BView P.expression=",P.expression);
         }
         //--------------------------------------------------------------
         var P = new ChannelCombination;
         P.colorSpace = ChannelCombination.prototype.RGB;
         P.channels = [ // enabled, id
                     [true, R_NAME],
                     [true, G_NAME],
                     [true, B_NAME]
                  ];

         data.NBRGBView.mainView.beginProcess(UndoFlag_NoSwapFile);
         P.executeOn(data.NBRGBView.mainView);
         data.NBRGBView.mainView.endProcess();

         if (data.CSTF) {
            this.ApplyAutoSTF( data.NBRGBView.mainView, SHADOWS_CLIP, TARGET_BKG, data.CSTF_Linked );
            data.NBRGBImageSTF = this.applySTF(data.NBRGBView.mainView.image,data.NBRGBView.mainView.stf);
         }
         console.hide();
         data.Changed=false;
      }
   }

   this.showNBRGB = function() {

      if ((data.sourceRGBView==null || data.sourceRGBView.isNull ) ||
         (	(data.sourceNBrView==null || data.sourceNBrView.isNull ) &&
            (data.sourceNBgView==null || data.sourceNBgView.isNull ) &&
            (data.sourceNBbView==null || data.sourceNBbView.isNull) ) ) {
         var msg = new MessageBox( 	"Please select at least one source narrowband and an RGB image.",
                              "NBRGB Combination Script", StdIcon_Error, StdButton_Ok );
         msg.execute();
         return;
      }

      data.NBRGBView.mainView.stf=[[0.5,1,0,0,1],[0.5,1,0,0,1],[0.5,1,0,0,1],[0.5,1,0,0,1]];

      this.Calculate_NBRGB();

      if (data.CSTF){
         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBRGBImageSTF);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
      } else {
         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBRGBView.mainView.image);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
      }
   }


   this.showNBr = function() {
      if (data.sourceNBrView==null || data.sourceNBrView.isNull){
         var msg = new MessageBox( 	"Please select a source N/B image to merge with R (eg Ha).",
                              "NBRGB Combination Script", StdIcon_Error, StdButton_Ok );
         msg.execute();
         return;
      }

      if (data.CSTF) {
         if (data.NBrImageSTF==null){
            console.show();
            data.NBrView.mainView.beginProcess(UndoFlag_NoSwapFile);
            data.NBrView.mainView.image.assign(data.sourceNBrView.image);
            data.NBrView.mainView.endProcess();
         }
         this.ApplyAutoSTF( data.NBrView.mainView, SHADOWS_CLIP, TARGET_BKG, data.CSTF_Linked );
         data.NBrImageSTF = this.applySTF(data.NBrView.mainView.image,data.NBrView.mainView.stf);

         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBrImageSTF);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      } else {
         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBrView.mainView.image);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      }
   }

   this.showNBg = function() {
      if (data.sourceNBgView==null || data.sourceNBgView.isNull){
         var msg = new MessageBox( 	"Please select a source N/B image to merge with G (eg O3).",
                              "NBRGB Combination Script", StdIcon_Error, StdButton_Ok );
         msg.execute();
         return;
      }

      if (data.CSTF) {
         if (data.NBgImageSTF==null){
            console.show();
            data.NBgView.mainView.beginProcess(UndoFlag_NoSwapFile);
            data.NBgView.mainView.image.assign(data.sourceNBgView.image);
            data.NBgView.mainView.endProcess();
         }
         this.ApplyAutoSTF( data.NBgView.mainView, SHADOWS_CLIP, TARGET_BKG, data.CSTF_Linked );
         data.NBgImageSTF = this.applySTF(data.NBgView.mainView.image,data.NBgView.mainView.stf);

         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBgImageSTF);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      } else {
         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBgView.mainView.image);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      }
   }


   this.showNBb = function() {
      if (data.sourceNBbView==null || data.sourceNBbView.isNull){
         var msg = new MessageBox( 	"Please select a source N/B image to merge with B (eg O3).",
                              "NBRGB Combination Script", StdIcon_Error, StdButton_Ok );
         msg.execute();
         return;
      }

      if (data.CSTF) {
         if (data.NBbImageSTF==null){
            console.show();
            data.NBbView.mainView.beginProcess(UndoFlag_NoSwapFile);
            data.NBbView.mainView.image.assign(data.sourceNBbView.image);
            data.NBbView.mainView.endProcess();
         }
         this.ApplyAutoSTF( data.NBbView.mainView, SHADOWS_CLIP, TARGET_BKG, data.CSTF_Linked );
         data.NBbImageSTF = this.applySTF(data.NBbView.mainView.image,data.NBbView.mainView.stf);

         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBbImageSTF);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      } else {
         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.NBbView.mainView.image);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      }
   }

   this.showRGB = function() {
      if (data.sourceRGBView==null || data.sourceRGBView.isNull){
         var msg = new MessageBox( 	"Please select a source RGB image.",
                              "NBRGB Combination Script", StdIcon_Error, StdButton_Ok );
         msg.execute();
         return;
      }

      if (data.CSTF) {
         if (data.RGBImageSTF==null){
            console.show();
            this.ApplyAutoSTF( data.sourceRGBView, SHADOWS_CLIP, TARGET_BKG, data.CSTF_Linked );
            data.RGBImageSTF = this.applySTF(data.sourceRGBView.image,data.sourceRGBView.stf);
         }
         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.RGBImageSTF);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      } else {
         data.Preview.mainView.beginProcess(UndoFlag_NoSwapFile);
         data.Preview.mainView.image.assign(data.sourceRGBView.image);
         data.Preview.mainView.endProcess();
         this.ScrollControl.updateView();
         console.hide();
      }
   }


   this.onMouseWheel = function(Dx,Dy, MouseWheel) {
      if (MouseWheel >0) {
         if (data.NBrView.visible ) {
            data.NBrView.zoomOut();
         } else {
            if (data.NBgView.visible ) {
               data.NBgView.zoomOut();
            } else {
               if (data.NBbView.visible ) {
                  data.NBbView.zoomOut();
               } else {
                  data.Preview.zoomOut();
               }
            }
         }
      } else {
         if (data.NBrView.visible ) {
            data.NBrView.zoomIn();
         } else {
            if (data.NBgView.visible ) {
               data.NBgView.zoomIn();
            } else {
               if (data.NBbView.visible ) {
                  data.NBbView.zoomIn();
               } else {
                  data.Preview.zoomIn();
               }
            }
         }
      }
      this.ScrollControl.updateView();
   }

   this.ScrollControl = new Control( this );

   this.ScrollControl.updateView = function()
   {
      var imageWidth = data.Preview.mainView.image.width;
      var imageHeight = data.Preview.mainView.image.height;
      var width, height;
      if ( imageWidth > imageHeight )
      {
         width = PREVIEW_SIZE;
         height = PREVIEW_SIZE*imageHeight/imageWidth;
      }
      else
      {
         width = PREVIEW_SIZE*imageWidth/imageHeight;
         height = PREVIEW_SIZE;
      }
      this.setFixedSize( width, height );
      this.kw = 1/imageWidth*width;
      this.kh = 1/imageHeight*height;
      this.update();
      this.dialog.adjustToContents();
   };

   this.ScrollControl.scalingFactor = function()
   {
      return Math.sqrt( this.boundsRect.area/data.Preview.mainView.image.bounds.area );
   };

   this.ScrollControl.imageRect = function()
   {
      var rect = data.Preview.viewportToImage( data.Preview.visibleViewportRect );
      rect.mul( this.scalingFactor() );
      return rect;
   };

   this.ScrollControl.toolTip = "<p>Control the Preview window (zoom/scroll) using this image</p>";
   this.ScrollControl.cursor = new Cursor( StdCursor_CirclePlus );

   this.ScrollControl.dragging = false;
   this.ScrollControl.dragOffset = null;

   this.ScrollControl.onPaint = function()
   {
      var G = new Graphics( this );
      G.drawScaledBitmap( this.boundsRect, data.Preview.mainView.image.render() );
      G.pen = new Pen( 0xFF00FF00 ); //Green
      G.drawRect( this.imageRect() );
      G.end();
   };

   this.ScrollControl.onMousePress = function( x, y )
   {
      this.dragging = true;
      this.dragOffset = new Point( x, y );
      this.dragOffset.sub( this.imageRect().center );
   };

   this.ScrollControl.onMouseRelease = function()
   {
      this.dragging = false;
      this.dragOffset = null;
   };

   this.ScrollControl.onMouseMove = function( x, y )
   {
      if ( this.dragging )
      {
         var scale = this.scalingFactor();
         data.Preview.setViewport( (x - this.dragOffset.x)/scale, (y - this.dragOffset.y)/scale );
         this.update();
      }
   };

   this.ScrollControl.updateView( data.Preview.mainView );

   //---------------------------------------------------------------------------------------
   // Zoom buttons
   var labelWidth1 = this.font.width( "----------------------" + 'T' );


   this.ZoomToFit_Button = new PushButton( this );
   with ( this.ZoomToFit_Button ) {
      text = "ZoomToFit";
      onClick = function() {
         if (data.NBrView.visible ) {
            data.NBrView.zoomToFit();
         } else {
            if (data.NBgView.visible ) {
               data.NBgView.zoomToFit();
            } else {
               if (data.NBbView.visible ) {
                  data.NBbView.zoomToFit();
               } else {
                  data.Preview.zoomToFit();
               }
            }
         }
         parent.ScrollControl.repaint();
      }
   }

   this.fitWindow_Button = new PushButton( this );
   with ( this.fitWindow_Button ) {
      text = "FitView";
      onClick = function() {
         if (data.NBrView.visible ) {
            data.NBrView.fitWindow();
         } else {
            if (data.NBgView.visible ) {
               data.NBgView.fitWindow();
            } else {
               if (data.NBbView.visible ) {
                  data.NBbView.fitWindow();
               } else {
                  data.Preview.fitWindow();
               }
            }
         }
         parent.ScrollControl.repaint();
      }
   }
   this.zoomToOptimalFit_Button = new PushButton( this );
   with ( this.zoomToOptimalFit_Button ) {
      text = "OptimalFit";
      onClick = function() {
         if (data.NBrView.visible ) {
            data.NBrView.zoomToOptimalFit();
         } else {
            if (data.NBgView.visible ) {
               data.NBgView.zoomToOptimalFit();
            } else {
               if (data.NBbView.visible ) {
                  data.NBbView.zoomToOptimalFit();
               } else {
                  data.Preview.zoomToOptimalFit();
               }
            }
         }
         parent.ScrollControl.repaint();
      }
   }


   // Preview buttons
   this.showNBRGB_Button = new PushButton( this );
   with ( this.showNBRGB_Button ) {
      text = "NBRGB";
      toolTip = "<p>Show the final image at the preview window</p>";
      onClick = function() {
         parent.showNBRGB();
      }
   }

   this.showRGB_Button = new PushButton( this );
   with ( this.showRGB_Button ) {
      text = "RGB";
      toolTip = "<p>Show the source RGB image at the preview window</p>";
      onClick = function() {
         parent.showRGB();
      }
   }
   this.showNBr_Button = new PushButton( this );
   with ( this.showNBr_Button ) {
      text = "R channel";
      toolTip = "<p>Show the narrowband image that will be merged with R, at the preview window</p>";
      onClick = function() {
         parent.showNBr();
      }
   }
   this.showNBg_Button = new PushButton( this );
   with ( this.showNBg_Button ) {
      text = "G channel";
      toolTip = "<p>Show the narrowband image that will be merged with G, at the preview window</p>";
      onClick = function() {
         parent.showNBg();
      }
   }
   this.showNBb_Button = new PushButton( this );
   with ( this.showNBb_Button ) {
      text = "B channel";
      toolTip = "<p>Show the narrowband image that will be merged with B, at the preview window</p>";
      onClick = function() {
         parent.showNBb();
      }
   }

   this.STF_CheckBox = new CheckBox( this );
   with ( this.STF_CheckBox) {
      text = "AutoSTF";
      checked = data.CSTF;
      toolTip = "<p>If this option is selected, the script will perfom an AutoSTF "	+ "to the final image.</p>";
      onCheck = function( checked ) {
         //data.Changed=true;
         data.CSTF = checked;
      }
   };

   this.STF_LinkCheckBox = new CheckBox( this );
   with ( this.STF_LinkCheckBox) {
      text = "Linked STF";
      checked = data.CSTF_Linked;
      toolTip = "<p>During STF, should the RGB channels be linked ?</p>";
      onCheck = function( checked ) {
         data.CSTF_Linked = checked;
      }
   };


   this.Rescale_CheckBox = new CheckBox( this );
   with ( this.Rescale_CheckBox )  {
      text = "Non Linear";
      checked = data.CRescale;
      toolTip = "<p>If this option is selected, the script will rescale " + "pixelmath expressions for non linear images.</p>";
      onCheck = function( checked ) {
         data.Changed=true;
         data.CRescale = checked;
      }
   };



   this.applyButton = new PushButton( this );
   this.applyButton.text = "Apply";
   this.applyButton.icon = this.scaledResource( ":/icons/gears.png" );
   this.applyButton.onClick = function() {
      data.Changed=true;
      this.parent.showNBRGB();
   };

   this.okButton = new PushButton( this );
   this.okButton.text = "OK";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function() {
      data.NBRGBView.deletePreviews();
      data.NBRGBView.show();
      this.dialog.ok();
   };

   this.cancelButton = new PushButton( this );
   this.cancelButton.text = "Cancel";
   this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelButton.onClick = function() {
      data.NBRGBView.deletePreviews();
      data.NBRGBView.forceClose();
      this.dialog.cancel();
   };



   //--------------------------
   // RGB selector and sliders
   this.sourceRGBImage_Label = new Label( this );
   this.sourceRGBImage_Label.minWidth = labelWidth1; // align with labels inside group boxes below
   this.sourceRGBImage_Label.text = "Source image:";
   this.sourceRGBImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.sourceRGBImage_ViewList = new ViewList( this );
   this.sourceRGBImage_ViewList.excludeIdentifiersPattern = "^NBRGBCombination*";
   this.sourceRGBImage_ViewList.getAll();
   with ( this.sourceRGBImage_ViewList ) {
      scaledMinWidth = 200;
      toolTip = "Select the source RGB image.";
      onViewSelected = function( view ) {
         data.Changed=true;
         data.sourceRGBView = view;
         if (view.isNull) {
            data.sourceRGBControl.enabled = false;
         } else {
            data.sourceRGBControl.enabled = true;
         }
      };
   }

   this.sourceRGBImage_Sizer = new HorizontalSizer;
   this.sourceRGBImage_Sizer.spacing = 4;
   this.sourceRGBImage_Sizer.add( this.sourceRGBImage_Label );
   this.sourceRGBImage_Sizer.add( this.sourceRGBImage_ViewList, 100 );

   data.sourceRGBControl = new NumericControl( this );
   with ( data.sourceRGBControl ) {
      enabled = false;
      setRange( 0, 200 );
      label.text = "Bandwidth (nm):";
      label.minWidth = labelWidth1;
      slider.setRange( 0.0, 900.0 );
      slider.scaledMinWidth = 200;
      setPrecision (2);
      setValue( data.sourceRGBBandwidth);
      toolTip = "<p>RGB's total Bandwidth</p>";
      onValueUpdated = function( value ) {
         data.Changed=true;
         data.sourceRGBBandwidth = value;
      };
   }


   //---------------------------------------
   // NBr (eg Ha) selector and sliders

   this.sourceNBrImage_Label = new Label( this );
   this.sourceNBrImage_Label.minWidth = labelWidth1; // align with labels inside group boxes below
   this.sourceNBrImage_Label.text = "Source image:";
   this.sourceNBrImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.sourceNBrImage_ViewList = new ViewList( this );
   this.sourceNBrImage_ViewList.excludeIdentifiersPattern = "^NBRGBCombination*";
   this.sourceNBrImage_ViewList.getAll();
   with (this.sourceNBrImage_ViewList) {
      scaledMinWidth = 200;
      toolTip = "Select the narrowband image to be merged with R (eg Ha).";
      onViewSelected = function( view ) {
         data.Changed=true;
         data.sourceNBrView = view;
         if (view.isNull) {
            data.sourceNBrControl.enabled = false;
            data.sourceNBrMultiplicationControl.enabled = false;
         } else {
            data.sourceNBrControl.enabled = true;
            data.sourceNBrMultiplicationControl.enabled = true;
         }
      }
   }


   this.sourceNBrImage_Sizer = new HorizontalSizer;
   this.sourceNBrImage_Sizer.spacing = 4;
   this.sourceNBrImage_Sizer.add( this.sourceNBrImage_Label );
   this.sourceNBrImage_Sizer.add( this.sourceNBrImage_ViewList, 100 );

   data.sourceNBrControl = new NumericControl( this );
   with ( data.sourceNBrControl ) {
      enabled = false;
      setRange( 0.0, 100.0 );
      label.text = "Bandwidth (nm):";
      label.minWidth = labelWidth1;
      slider.setRange( 0.0, 100.0 );
      slider.scaledMinWidth = 200;
      setPrecision (2);
      setValue( data.sourceNBrBandwidth);
      toolTip = "<p>Narrowband filter's bandwidth (nm).</p>";
      onValueUpdated = function( value ) {
         data.Changed=true;
         data.sourceNBrBandwidth = value;
         console.writeln("DEBUG value=",value);
      };
   }
   data.sourceNBrMultiplicationControl = new NumericControl( this );
   with ( data.sourceNBrMultiplicationControl ) {
      enabled = false;
      setRange( 0.0, 10.0 );
      label.text = "Scale :";
      label.minWidth = labelWidth1;
      slider.setRange( 0.0, 100.0 );
      slider.scaledMinWidth = 200;
      setValue( data.sourceNBrMultiplication);
      setPrecision (2);
      toolTip = "<p>R channel's multiplication factor.</p>";
      onValueUpdated = function( value ) {
         data.Changed=true;
         data.sourceNBrMultiplication = value;
      };
   }


   //---------------------------------------
   // NBg (eg O3) selector and sliders

   this.sourceNBgImage_Label = new Label( this );
   this.sourceNBgImage_Label.minWidth = labelWidth1; // align with labels inside group boxes below
   this.sourceNBgImage_Label.text = "Source image:";
   this.sourceNBgImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.sourceNBgImage_ViewList = new ViewList( this );
   this.sourceNBgImage_ViewList.excludeIdentifiersPattern = "^NBRGBCombination*";
   this.sourceNBgImage_ViewList.getAll();
   with (this.sourceNBgImage_ViewList) {
      scaledMinWidth = 200;
      toolTip = "Select the narrowband image to be merged with G (eg O3).";
      onViewSelected = function( view ) {
         data.Changed=true;
         data.sourceNBgView = view;
         if (view.isNull) {
            data.sourceNBgControl.enabled = false;
            data.sourceNBgMultiplicationControl.enabled = false;
         } else {
            data.sourceNBgControl.enabled = true;
            data.sourceNBgMultiplicationControl.enabled = true;
         }
      }
   };

   this.sourceNBgImage_Sizer = new HorizontalSizer;
   this.sourceNBgImage_Sizer.spacing = 4;
   this.sourceNBgImage_Sizer.add( this.sourceNBgImage_Label );
   this.sourceNBgImage_Sizer.add( this.sourceNBgImage_ViewList, 100 );

   data.sourceNBgControl = new NumericControl( this );
   with ( data.sourceNBgControl ) {
      enabled = false;
      setRange( 0.0, 100.0 );
      label.text = "Bandwidth (nm):";
      label.minWidth = labelWidth1;
      slider.setRange( 0.0, 100.0 );
      slider.scaledMinWidth = 200;
      setPrecision (2);
      setValue( data.sourceNBgBandwidth);
      toolTip = "<p>Narrowband filter's bandwidth (nm).</p>";
      onValueUpdated = function( value ) {
         data.Changed=true;
         data.sourceNBgBandwidth = value;
      };
   }
   data.sourceNBgMultiplicationControl = new NumericControl( this );
   with ( data.sourceNBgMultiplicationControl ) {
      enabled = false;
      setRange( 0.0, 10.0 );
      label.text = "Scale:";
      label.minWidth = labelWidth1;
      slider.setRange( 0.0, 100.0 );
      slider.scaledMinWidth = 200;
      setValue( data.sourceNBgMultiplication);
      setPrecision (2);
      toolTip = "<p>G channel's multiplication factor.</p>";
      onValueUpdated = function( value ) {
         data.Changed=true;
         data.sourceNBgMultiplication = value;
      };
   }

   //---------------------------------------
   // NBb (eg O3) selector and sliders

   this.sourceNBbImage_Label = new Label( this );
   this.sourceNBbImage_Label.minWidth = labelWidth1; // align with labels inside group boxes below
   this.sourceNBbImage_Label.text = "Source image:";
   this.sourceNBbImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.sourceNBbImage_ViewList = new ViewList( this );
   this.sourceNBbImage_ViewList.excludeIdentifiersPattern = "^NBRGBCombination*";
   this.sourceNBbImage_ViewList.getAll();
   with (this.sourceNBbImage_ViewList) {
      scaledMinWidth = 200;
      toolTip = "Select the narrowband image to be merged with B (eg O3).";
      onViewSelected = function( view ) {
         data.Changed=true;
         data.sourceNBbView = view;
         if (view.isNull) {
            data.sourceNBbControl.enabled = false;
            data.sourceNBbMultiplicationControl.enabled = false;
         } else {
            data.sourceNBbControl.enabled = true;
            data.sourceNBbMultiplicationControl.enabled = true;
         }

      }
   };

   this.sourceNBbImage_Sizer = new HorizontalSizer;
   this.sourceNBbImage_Sizer.spacing = 4;
   this.sourceNBbImage_Sizer.add( this.sourceNBbImage_Label );
   this.sourceNBbImage_Sizer.add( this.sourceNBbImage_ViewList, 100 );

   data.sourceNBbControl = new NumericControl( this );
   with ( data.sourceNBbControl ) {
      enabled = false;
      setRange( 0.0, 100.0 );
      label.text = "Bandwidth (nm):";
      label.minWidth = labelWidth1;
      slider.setRange( 0.0, 100.0 );
      slider.scaledMinWidth = 200;
      setPrecision (2);
      setValue( data.sourceNBbBandwidth);
      toolTip = "<p>Narrowband filter's bandwidth (nm).</p>";
      onValueUpdated = function( value ) {
         data.Changed=true;
         data.sourceNBbBandwidth = value;
      };
   }
   data.sourceNBbMultiplicationControl = new NumericControl( this );
   with ( data.sourceNBbMultiplicationControl ) {
      enabled = false;
      setRange( 0.0, 10.0 );
      label.text = "Scale :";
      label.minWidth = labelWidth1;
      slider.setRange( 0.0, 100.0 );
      slider.scaledMinWidth = 200;
      setValue( data.sourceNBbMultiplication);
      setPrecision (2);
      toolTip = "<p>B channel's multiplication factor.</p>";
      onValueUpdated = function( value ) {
         data.Changed=true;
         data.sourceNBbMultiplication = value;
      };
   }



   // --------------- Arrange on Screen


   this.zoombuttonssizer = new VerticalSizer;
   with ( this.zoombuttonssizer ) {
      margin = 0;
      spacing = 6;
      add( this.ZoomToFit_Button );
      add( this.fitWindow_Button );
      add( this.zoomToOptimalFit_Button );
      add( this.STF_CheckBox);
      add( this.STF_LinkCheckBox);
      add( this.Rescale_CheckBox);
      addStretch();
   }


   this.showbuttonssizer = new VerticalSizer;
   with ( this.showbuttonssizer ) {
      margin = 0;
      spacing = 6;
      add( this.showNBr_Button);
      add( this.showNBg_Button);
      add( this.showNBb_Button);
      add( this.showRGB_Button);
      add( this.showNBRGB_Button);
      addStretch();
   }

   this.PWButtonsSizer = new HorizontalSizer;
   with ( this.PWButtonsSizer ) {
      margin = 0;
      spacing = 8;
      add( this.ScrollControl, 100 );
      add( this.showbuttonssizer );
      add( this.zoombuttonssizer );
      addStretch();
   }


   this.RGBGroupBox = new GroupBox( this );
   with ( this.RGBGroupBox ) {
      title = "RGB source Image";
      sizer = new VerticalSizer;
      sizer.margin = 6;
      sizer.spacing = 6;
      sizer.add( this.sourceRGBImage_Sizer);
      sizer.add( data.sourceRGBControl );
   }

   this.NBrGroupBox = new GroupBox( this );
   with ( this.NBrGroupBox ) {
      title = "Narrowband for R channel (eg Ha)";
      sizer = new VerticalSizer;
      sizer.margin = 6;
      sizer.spacing = 6;
      sizer.add( this.sourceNBrImage_Sizer);
      sizer.add( data.sourceNBrControl );
      sizer.add( data.sourceNBrMultiplicationControl );

   }

   this.NBgGroupBox = new GroupBox( this );
   with ( this.NBgGroupBox ) {
      title = "Narrowband for G channel (eg O3)";
      sizer = new VerticalSizer;
      sizer.margin = 6;
      sizer.spacing = 6;
      sizer.add( this.sourceNBgImage_Sizer);
      sizer.add( data.sourceNBgControl );
      sizer.add( data.sourceNBgMultiplicationControl );
   }

   this.NBbGroupBox = new GroupBox( this );
   with ( this.NBbGroupBox ) {
      title = "Narrowband for B channel (eg O3)";
      sizer = new VerticalSizer;
      sizer.margin = 6;
      sizer.spacing = 6;
      sizer.add( this.sourceNBbImage_Sizer);
      sizer.add( data.sourceNBbControl );
      sizer.add( data.sourceNBbMultiplicationControl );
   }


   // -------------OK,Apply,Cancel buttons
   this.buttons = new HorizontalSizer;
   with (this.buttons) {
      spacing = 8;
      add( this.applyButton );
      addStretch();
      add( this.cancelButton );
      add( this.okButton );
   }

   // channels and ok buttons
   this.tabsbuttons = new VerticalSizer;
   with ( this.tabsbuttons ) {
      margin = 6;
      spacing = 6;
      addStretch();
      add( this.RGBGroupBox);
      add( this.NBrGroupBox );
      add( this.NBgGroupBox );
      add( this.NBbGroupBox );
      addSpacing( 8 );
      add( this.buttons);
   }


   // all together
   this.sizer = new VerticalSizer;
   with ( this.sizer ) {
      margin = 8;
      spacing = 8;
      add( this.PWButtonsSizer );
      add( this.tabsbuttons );
   }

   // window
   this.windowTitle = "NBRGB Combination Script";
   this.adjustToContents();
   this.setFixedSize();
}


function main () {

   var dlg = new MyDialog;
   dlg.userResizable=false;
   console.hide();
   dlg.execute();
}

MyDialog.prototype = new Dialog;
var window = ImageWindow.activeWindow;
var data = new NBRGBCombinationData;

main();
