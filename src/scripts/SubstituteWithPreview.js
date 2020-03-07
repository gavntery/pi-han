#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/ColorSpace.jsh>

#define VERSION "1.00"
#define TITLE "Substitute with Preview"

#feature-id Utilities > SubstituteWithPreview
#feature-info A simple script to replace areas of an image with previews \
   defined in the same or other image.<br><br/>\
   <br/>\
   Copyright &copy; 2010 Juan M. G&oacute;mez

function SubstitutePreviewData()
{
   this.sourceView = ImageWindow.activeWindow.mainView;
   this.targetView = ImageWindow.activeWindow.mainView;
}

var data = new SubstitutePreviewData;

function SubstitutePreviewDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var labelWidth1 = 100;

   //

   this.helpLabel = new Label( this );
   with ( this.helpLabel )
   {
      frameStyle = FrameStyle_Box;
      margin = 4;
      wordWrapping = true;
      useRichText = true;
      text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A script for preview substitution.</p>";
   }

   this.sourceImage_Label = new Label( this );
   with ( this.sourceImage_Label )
   {
      minWidth = labelWidth1 + this.logicalPixelsToPhysical( 6+1 ); // align with labels inside group boxes below
      text = "Source image:";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
   }

   this.sourceImage_ViewList = new ViewList( this );
   with ( this.sourceImage_ViewList )
   {
      scaledMinWidth = 200;
      getMainViews(); // include main views
      currentView = data.sourceView;
      toolTip = "Select the source image with preview.";
      onViewSelected = function( view )
      {
         data.sourceView = view;
      };
   }

   this.sourceImage_Sizer = new HorizontalSizer;
   with ( this.sourceImage_Sizer )
   {
      spacing = 4;
      add( this.sourceImage_Label );
      add( this.sourceImage_ViewList, 100 );
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
      getMainViews(); // include main views
      currentView = data.targetView;
      toolTip = "Select the target image to substitute with preview.";
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

   this.ok_Button = new PushButton (this);
   with ( this.ok_Button )
   {
      text = "OK";

      // Do it
      onClick = function()
      {
         if ( data.sourceView.window.previews.length == 0 )
         {
            var msg = new MessageBox( "Source image has no previews. Select a source image with previews.",
                                    "Substitute with Preview Script", StdIcon_Error, StdButton_Ok );
            msg.execute();
            return;
         }
         else
         {
            var finalView= new ImageWindow( data.targetView.image.width,
                                          data.targetView.image.height,
                                          data.targetView.image.numberOfChannels,
                                          data.targetView.window.bitsPerSample,
                                          data.targetView.window.isFloatSample,
                                          data.targetView.image.colorSpace != ColorSpace_Gray,
                                          "FinalView" );

            finalView.mainView.beginProcess(UndoFlag_NoSwapFile);
            finalView.mainView.image.assign( data.targetView.image );
            finalView.mainView.endProcess();

            var previews = data.sourceView.window.previews;

            for ( var i = 0; i < previews.length; ++i )
            {
               var fullViewpoints = data.sourceView.window.previewRect(previews[i]);
               finalView.mainView.beginProcess(UndoFlag_NoSwapFile);
               finalView.mainView.image.selectedPoint = new Point(fullViewpoints.x0,fullViewpoints.y0);
               finalView.mainView.image.apply(previews[i].image);
               finalView.mainView.endProcess();
               finalView.show();
            }

            this.dialog.ok();
         }
      };
   }

   this.cancel_Button = new PushButton (this);
   with ( this.cancel_Button )
   {
      text = "Cancel";

      onClick = function() {
         this.dialog.cancel();
      };
   }

   this.buttons_Sizer = new HorizontalSizer;
   with ( this.buttons_Sizer )
   {
      spacing = 4;
      add( this.cancel_Button );
      add( this.ok_Button );
   }

   this.sizer = new VerticalSizer;
   with ( this.sizer )
   {
      margin = 6;
      spacing = 2;
      addStretch();
      add ( this.helpLabel );
      addSpacing (4);
      add( this.sourceImage_Sizer );
      add( this.targetImage_Sizer );
      addSpacing (4);
      add ( this.buttons_Sizer );
   }
}

SubstitutePreviewDialog.prototype = new Dialog;

function main()
{
   console.hide();

   if ( data.sourceView.isNull )
   {
      var msg = new MessageBox( "There is no active image window!",
                                "Substitute with Preview Script", StdIcon_Error, StdButton_Ok );
      msg.execute();
      return;
   }

   var dialog = new SubstitutePreviewDialog();
   dialog.execute();

}

main();
