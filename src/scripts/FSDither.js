
/*
 * FSDither v1.0
 *
 * Converts a image to one having 8 bit-depth (per channel) with FloydSteinberg dithering.
 *
 * Copyright (C) Colin B. Gallant
 *
 */


#define VERSION "1.0"
#define TITLE   "FSDither"

#feature-id    Utilities > FSDither

#feature-info  Converts a image to one having 8 bit-depth (per channel) with FloydSteinberg dithering.<br/>\
               Copyright (C) 2012 Colin B. Gallant

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

/**
 * Dither to user set bit depth using Floyd Steinberg dithering
 */
function FSDither( image )
{
   // Get image info
   var n = image.numberOfChannels;
   var w = image.width;
   var h = image.height;
   var bitdepth = 255.0;
   // Create temporary image
   var tmp = new Image( w, h, n );

   // Status monitor stuff
   image.statusEnabled = true;
   image.initializeStatus( "FS Dithering", w*h*n ); // ###*###
   image.statusInitializationEnabled = false;

   // Reset the rectangular selection to the whole image boundaries
   image.resetRectSelection();

   tmp.apply(image); // initialize temporary image with actual image
   // Loop through channels
   for ( var c = 0; c < n; ++c )
   {
      // Loop through rows i
      for ( var i = 0; i < h; ++i )
      {
         // Loop through columns j
         for ( var j = 0; j < w; ++j )
         {
		      var oldpxl = tmp.sample(j,i,c);
      		var newpxl = Math.round(oldpxl*bitdepth)/bitdepth;

            tmp.setSample(newpxl,j,i,c);
            var pxlerror =  oldpxl-newpxl;

            if (j<(w-1))
            tmp.setSample(tmp.sample(j+1,i,c) + pxlerror*7.0/16.0,j+1,i,c);

            if (j>=1 && i<(h-1))
            tmp.setSample(tmp.sample(j-1,i+1,c) + pxlerror*3.0/16.0,j-1,i+1,c);

            if (i<(h-1))
            tmp.setSample(tmp.sample(j,i+1,c) + pxlerror*5.0/16.0,j,i+1,c);

            if (j<(w-1) && i<(h-1))
            tmp.setSample(tmp.sample(j+1,i+1,c) + pxlerror*1.0/16.0,j+1,i+1,c);
         }

         image.advanceStatus( w ); // ###*###
      }
   }
   // Create 8 bit RGB image and copy temp image to it
   var ditherwindow = new ImageWindow( w, h, 3, 8, false, true );
   var ditherview = ditherwindow.mainView;
   ditherview.beginProcess();
   ditherview.image.apply( tmp );
   ditherview.endProcess();

   ditherwindow.bringToFront();

   //Free up temporary image

   tmp.free();
}

/**
 * Data
 */
function FSDitherData()
{
   // Active image window
   var window = ImageWindow.activeWindow;

   if ( !window.isNull )
      this.targetView = window.currentView;
}

// Global variables.
var data = new FSDitherData;

/**
 * UI
 */
function FSDitherDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION + "</b> &mdash; This script applies the Floyd Steinberg dithering algorithm " +
      " (a well known error diffusion algorithm) to an image.  A bit depth of 8 is used to generate colors and a new image" +
      " (8bit RGB) is generated.";

   this.targetImage_Label = new Label( this );
   this.targetImage_Label.text = "Target image:";
   this.targetImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.targetImage_ViewList = new ViewList( this );
   this.targetImage_ViewList.scaledMinWidth = 300;
   this.targetImage_ViewList.getAll(); // include main views as well as previews
   this.targetImage_ViewList.currentView = data.targetView;
   this.targetImage_ViewList.toolTip = "Select the image to which FS dithering is to be applied.";

   this.targetImage_ViewList.onViewSelected = function( view )
   {
      data.targetView = view;
   };

   this.targetImage_Sizer = new HorizontalSizer;
   this.targetImage_Sizer.spacing = 4;
   this.targetImage_Sizer.add( this.targetImage_Label );
   this.targetImage_Sizer.add( this.targetImage_ViewList, 100 );

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";

   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";

   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.targetImage_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();
}

// Inherits properties and methods from Dialog object.
FSDitherDialog.prototype = new Dialog;


/*
 * Main srcript.
 */
function main()
{
   console.hide();

   if ( !data.targetView )
   {
      (new MessageBox( "There is no active image window!",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   var dialog = new FSDitherDialog();
   for ( ;; )
   {
      if ( !dialog.execute() )
         break;

      // A view must be selected.
      if ( data.targetView.isNull )
      {
         (new MessageBox( "You must select a view to apply this script.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         continue;
      }

      console.abortEnabled = true;
      console.show();

      var t0 = new Date;

      data.targetView.beginProcess();

      FSDither( data.targetView.image );

      data.targetView.endProcess();

      var t1 = new Date;
      console.writeln( format( "<end><cbr>FSDither: %.2f s", (t1.getTime() - t0.getTime())/1000 ) );

      // Quit after successful execution.
      break;
   }
}

main();

