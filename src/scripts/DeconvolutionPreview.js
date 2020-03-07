/*
   DeconvolutionPreview v1.01

   A script for assisted deconvolution. The script provides several previews
   applying deconvolutions with varying point spread functions (PSF), as a
   function of the specified sigma and shape parameters. The sigma and shape
   values are plotted on each deconvolved preview for easy reference.

   Copyright (C) 2009 Juan M. Gómez (Pixinsight user)

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

   1.01: Code cleanups and updated tooltip and feature information.
         Published as an official PixInsight script.

   1.0:  Initial version published on PixInsight Forum.
*/

#feature-id    Utilities > DeconvolutionPreview

#feature-info  A script for assisted deconvolution.<br/>\
   <br/>\
   The script provides several previews applying deconvolutions with varying point spread \
   functions (PSF), as a function of the specified <i>sigma</i> and <i>shape</i> parameters. \
   The sigma and shape values are plotted on each deconvolved preview for easy reference.<br/>\
   <br/>\
   Copyright &copy; 2009 Juan M. G&oacute;mez

#feature-icon  DeconvolutionPreview.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/SampleType.jsh>

#define VERSION "1.01"
#define TITLE "DeconvolutionPreview"

// ----------------------------------------------------------------------------

function DeconvolutionPreviewData()
{
   this.targetView = ImageWindow.activeWindow.currentView;
   this.GaussianStart = 1.50;
   this.GaussianAmount = 0.50;
   this.GaussianIterations = 3;
   this.ShapeStart = 2.00;
   this.ShapeAmount = 0.50;
   this.ShapeIterations = 3;
}

var data = new DeconvolutionPreviewData;

// ----------------------------------------------------------------------------

function doDeconvolutionPreview( data )
{
   var v = data.targetView;
   if ( v.isNull )
      throw Error( "No target view has been specified." );

   var preview_img = new ImageWindow (
            v.image.width*(data.GaussianIterations)+((data.GaussianIterations+1)*3),
            v.image.height*(data.ShapeIterations)+((data.ShapeIterations+1)*3),
            3,
            v.image.bitsPerSample, v.image.sampleType == SampleType_Real,
            true, "DeconvolutionPreview");
   with ( preview_img.mainView )
   {
      beginProcess( UndoFlag_NoSwapFile );
      image.fill (0x80000000);
      endProcess();
   }

   var copy_img = new ImageWindow (
            v.image.width,
            v.image.height,
            3,
            v.image.bitsPerSample, v.image.sampleType == SampleType_Real,
            true, "WorkingWindow");

   for ( var j = 0; j < data.GaussianIterations; j++ ) {
      for ( var i = 0; i < data.ShapeIterations; i++ ) {

         with ( copy_img.mainView )
         {
             beginProcess( UndoFlag_NoSwapFile );
             image.apply( v.image );
             doDeconvolution( copy_img.mainView,
                              data.GaussianStart + data.GaussianAmount*j,
                              data.ShapeStart + data.ShapeAmount*i );
             endProcess();
         }

         with ( preview_img.mainView )
         {
            beginProcess( UndoFlag_NoSwapFile );
            image.selectedPoint = new Point( v.image.width *j + j*3 + 3,
                                             v.image.height*i + i*3 + 3 );
            image.apply( copy_img.mainView.image );
            endProcess();
         }
      }
   }

   /*
   copy_img.undoAll();
   copy_img.purge();
   copy_img.close();
   */
   copy_img.forceClose();  // replaces the above 3 lines
   copy_img = null;

   preview_img.show();
   preview_img.zoomToFit();
}

function DrawSignature( data )
{
   var image = data.targetView.image;
   // Create the font
   var font = new Font( data.fontFace );
   font.pixelSize = data.fontSize;
   // Calculate a reasonable inner margin in pixels
   var innerMargin = Math.round( font.pixelSize/5 );
   // Calculate the sizes of our drawing box
   var width = font.width( data.text ) + 2*innerMargin;
   var height = font.ascent + font.descent + 2*innerMargin;
   // Create a bitmap where we'll perform all of our drawing work
   var bmp = new Bitmap( width, height );
   // Fill the bitmap with the background color
   bmp.fill( 0x80000000 );
   // Create a graphics context for the working bitmap
   var G = new Graphics( bmp );

   // Select the required drawing tools: font and pen.
   G.font = font;
   G.pen = new Pen( data.textColor );
   G.transparentBackground = true; // draw text with transparent bkg
   G.textAntialiasing = true;

   // Now draw the signature
   G.drawText( innerMargin, height - font.descent - innerMargin, data.text );

   // Finished drawing
   G.end();
   image.selectedPoint = new Point( data.margin, image.height - data.margin - height );
   image.blend( bmp );
}

function DrawSignatureData( cView, text )
{
   this.targetView = cView;
   this.text = text;
   this.fontFace = "Helvetica";
   this.fontSize = 14; // px
   this.bold = true;
   this.italic = false;
   this.stretch = 100;
   this.textColor = 0xffff7f00;
   this.bkgColor = 0x80000000;
   this.margin = 2;
}

function doDeconvolution( ParsedView, GaussianSigma, GaussianShape )
{
   var p = new Deconvolution;
   with ( p )
   {
      algorithm = RichardsonLucy;
      numberOfIterations = 30;
      deringing = true;
      deringingDark = 0.1000;
      deringingBright = 0.0000;
      deringingSupport = false;
      deringingSupportAmount = 0.70;
      deringingSupportViewId = "";
      useLuminance = true;
      linear = false;
      psfMode = Gaussian;
      psfGaussianSigma = GaussianSigma;
      psfGaussianShape = GaussianShape;
      psfGaussianAspectRatio = 1.00;
      psfGaussianRotationAngle = 0.00;
      psfMotionLength = 5.00;
      psfMotionRotationAngle = 0.00;
      psfViewId = "";
      psfFFTSizeLimit = 15;
      useRegularization = true;
      waveletLayers = // noiseThreshold, noiseReduction
      [
      [3.00, 1.00],
      [2.00, 0.70],
      [1.00, 0.70],
      [1.00, 0.70],
      [1.00, 0.70]];
      noiseModel = Gaussian;
      numberOfWaveletLayers = 2;
      scalingFunction = B3Spline5x5;
      convergence = 0.0000;
      rangeLow = 0.0000000;
      rangeHigh = 0.0000000;
      iterations = // count
      [
      [0],
      [0],
      [0]];
   }

   p.executeOn( ParsedView );

   var data = new DrawSignatureData( ParsedView, "Sigma:" + GaussianSigma + " Shape: " + GaussianShape );
   DrawSignature( data );
}

// ----------------------------------------------------------------------------

function DeconvolutionPreviewDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var emWidth = this.font.width( 'M' );
   var labelWidth1 = this.font.width( "PSF Gaussian Start:" + 'T' );

   //

   this.helpLabel = new Label( this );
   with ( this.helpLabel )
   {
      frameStyle = FrameStyle_Box;
      margin = 4;
      wordWrapping = true;
      useRichText = true;
      text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A script for assisted deconvolution.</p>"
         + "<p>The script provides several previews applying deconvolutions with varying point "
         + "spread functions (PSF), as a function of the specified <i>sigma</i> and <i>shape</i> parameters.</p>"
         + "<p>The sigma and shape values are plotted on each deconvolved preview for easy reference."
         + "<p>Copyright &copy; 2009 Juan M. Gómez (Pixinsight user)</p>";
   }


   this.targetImage_Label = new Label( this );
   with ( this.targetImage_Label )
   {
      minWidth = labelWidth1 + this.logicalPixelsToPhysical( 6+1 ); // align with labels inside group boxes below
      text = "Target image:";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
   }

   this.targetImage_ViewList = new ViewList( this );
   with ( this.targetImage_ViewList )
   {
      scaledMinWidth = 200;
      getAll(); // include main views as well as previews
      currentView = data.targetView;
      toolTip = "Select the image to perform the deconvolved previews.";
      onViewSelected = function( view )
      {
         data.targetView = view;
      };
   }

   this.targetImage_Sizer = new HorizontalSizer;
   with ( this.targetImage_Sizer )
   {
      spacing = 4;
      add( this.targetImage_Label );
      add( this.targetImage_ViewList, 100 );
   }

   // PSF Gaussian parameters
   this.GaussianStart_NC = new NumericControl( this );
   with ( this.GaussianStart_NC )
   {
      label.text = "PSF Sigma start:";
      label.minWidth = labelWidth1;
      setRange( 0.10, 9.99 );
      slider.setRange( 0, 1000 );
      slider.scaledMinWidth = 250;
      setPrecision( 2 );
      setValue( data.GaussianStart );
      toolTip = "<p>PSF Sigma starting value.</p>";
      onValueUpdated = function( value )
      {
         data.GaussianStart = value;
      };
   }

   this.GaussianAmount_NC = new NumericControl( this );
   with ( this.GaussianAmount_NC )
   {
      label.text = "Step size:";
      label.minWidth = labelWidth1;
      setRange( 0.25, 6.00 );
      slider.setRange( 0, 1000 );
      slider.scaledMinWidth = 250;
      setPrecision( 2 );
      setValue( data.GaussianAmount );
      toolTip = "<p>PSF Sigma amount for each iteration.</p>";
      onValueUpdated = function( value )
      {
         data.GaussianAmount = value;
      };
   }

   this.Gaussianiter_Label = new Label( this );
   with ( this.Gaussianiter_Label )
   {
      minWidth = labelWidth1;
      text = "Iterations:";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
   }

   this.Gaussianiter_SpinBox = new SpinBox( this );
   with ( this.Gaussianiter_SpinBox )
   {
      minValue = 1;
      maxValue = 10;
      value = data.GaussianIterations;
      toolTip = "<p>Number of PSF Sigma iterations.</p>";
      onValueUpdated = function( value )
      {
         data.GaussianIterations = value;
      };
   }

   this.Gaussianiter_Sizer = new HorizontalSizer;
   with ( this.Gaussianiter_Sizer )
   {
      spacing = 4;
      add( this.Gaussianiter_Label );
      add( this.Gaussianiter_SpinBox );
      addStretch();
   }

   this.GaussianParGroupBox = new GroupBox( this );
   with ( this.GaussianParGroupBox )
   {
      title = "PSF Sigma Parameters";
      sizer = new VerticalSizer;
      with ( sizer )
      {
         margin = 6;
         spacing = 4;
         add( this.GaussianAmount_NC );
         add( this.GaussianStart_NC );
         add( this.Gaussianiter_Sizer );
      }
   }

  // PSF Shape parameters
   this.ShapeStart_NC = new NumericControl( this );
   with ( this.ShapeStart_NC )
   {
      label.text = "PSF Shape start:";
      label.minWidth = labelWidth1;
      setRange( 0.10, 9.99 );
      slider.setRange( 0, 1000 );
      slider.scaledMinWidth = 250;
      setPrecision( 2 );
      setValue( data.ShapeStart );
      toolTip = "<p>PSF Shape starting value.</p>";
      onValueUpdated = function( value )
      {
         data.ShapeStart = value;
      };
   }

   this.ShapeAmount_NC = new NumericControl( this );
   with ( this.ShapeAmount_NC )
   {
      label.text = "Step size:";
      label.minWidth = labelWidth1;
      setRange( 0.10, 9.99 );
      slider.setRange( 0, 1000 );
      slider.scaledMinWidth = 250;
      setPrecision( 2 );
      setValue( data.ShapeAmount );
      toolTip = "<p>PSF Shape amount for each iteration.</p>";
      onValueUpdated = function ( value )
      {
         data.ShapeAmount = value;
      };
   }

   this.Shapeiter_Label = new Label( this );
   with ( this.Shapeiter_Label )
   {
      minWidth = labelWidth1;
      text = "Iterations:";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
   }

   this.Shapeiter_SpinBox = new SpinBox( this );
   with ( this.Shapeiter_SpinBox )
   {
      minValue = 1;
      maxValue = 10;
      value = data.ShapeIterations;
      toolTip = "<p>Number of PSF Shape iterations.</p>";
      onValueUpdated = function( value )
      {
         data.ShapeIterations = value;
      };
   }

   this.Shapeiter_Sizer = new HorizontalSizer;
   with ( this.Shapeiter_Sizer )
   {
      spacing = 4;
      add( this.Shapeiter_Label );
      add( this.Shapeiter_SpinBox );
      addStretch();
   }

   this.ShapeParGroupBox = new GroupBox( this );
   with ( this.ShapeParGroupBox )
   {
      title = "PSF Shape Parameters";
      sizer = new VerticalSizer;
      with ( sizer )
      {
         margin = 6;
         spacing = 4;
         add( this.ShapeAmount_NC );
         add( this.ShapeStart_NC );
         add( this.Shapeiter_Sizer );
      }
   }

   // usual control buttons
   this.ok_Button = new PushButton( this );
   with ( this.ok_Button )
   {
      text = "OK";
      cursor = new Cursor( StdCursor_Checkmark );
      icon = this.scaledResource( ":/icons/ok.png" );
      onClick = function()
      {
         this.dialog.ok();
      };
   }

   this.cancel_Button = new PushButton( this );
   with ( this.cancel_Button )
   {
      text = "Cancel";
      cursor = new Cursor( StdCursor_Crossmark );
      icon = this.scaledResource( ":/icons/cancel.png" );
      onClick = function()
      {
         this.dialog.cancel();
      };
   }

   this.buttons_Sizer = new HorizontalSizer;
   with ( this.buttons_Sizer )
   {
      spacing = 4;
      addStretch();
      add( this.ok_Button );
      add( this.cancel_Button );
   }

   this.sizer = new VerticalSizer;
   with ( this.sizer )
   {
      margin = 8;
      spacing = 6;
      add( this.helpLabel );
      addSpacing( 4 );
      add( this.targetImage_Sizer );
      add( this.GaussianParGroupBox);
      add( this.ShapeParGroupBox);
      addSpacing( 4 );
      add( this.buttons_Sizer );
   }

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();
}

DeconvolutionPreviewDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   console.show();

   if ( !data.targetView )
   {
      var msg = new MessageBox( "There is no active image window!",
                                "Deconvolution Preview Script", StdIcon_Error, StdButton_Ok );
      msg.execute();
      return;
   }

   var dialog = new DeconvolutionPreviewDialog();
   for ( ;; )
   {
      if ( !dialog.execute() )
         break;

      // A view must be selected.
      if ( data.targetView.isNull )
      {
         var msg = new MessageBox( "You must select a view to apply this script.",
                                   "Deconvolution Preview Script", StdIcon_Error, StdButton_Ok );
         msg.execute();
         continue;
      }

      //console.show();
      doDeconvolutionPreview( data );
      break;
   }

   console.hide();
}

main();
