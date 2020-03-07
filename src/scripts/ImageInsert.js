/*
   ImageInsert Script

   This script allows you to insert a small image in a larger one,
   setting the position, margin, optional border width and border color.

   Written by Enzo De Bernardini (PixInsight user)

   Changelog:
   1.0: First release in PixInsight Forum
*/

#feature-id    Utilities > ImageInsert

#feature-info  "<p>This script allows you to insert a small image in a larger one, setting the position, margins, optional border width and border color.</p>"

#define TITLE  "ImageInsert"
#define VERSION "1.0.0"

#include <pjsr/Sizer.jsh>
#include <pjsr/Interpolation.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/ColorComboBox.jsh>
#include <pjsr/UndoFlag.jsh>

#define DEFAULT_TB_MARGIN 10
#define DEFAULT_RL_MARGIN 10
#define DEFAULT_BORDER_WIDTH 1

function Inset()
{
   this.executeMainFunction = function()
   {
      if(this.target_image == this.inset_image)
      {
         var msg = new MessageBox( "Same images selected!", "Image Selection Warning", StdIcon_Warning, StdButton_Ok );
         msg.execute();
         return false;
      }
      else
      {
         makeInset(this.target_image, this.inset_image, this.insetPosition, this.xMargin, this.yMargin, this.borderWidth, this.borderColor, this.croppedInsetClose);
         return true;
      } // if
   }; // executeMainFunction()
}; // Inset()

function makeInset(target_image, inset_image, insetPosition, xMargin, yMargin, borderWidth, borderColor, croppedInsetClose)
{

   var inset_w, inset_h, target_w, target_h, LM, TM, RM, BM, borderColor_r, borderColor_g, borderColor_b;

   // Target
   var target_window = ImageWindow.windowById( target_image );
   var target_img    = target_window.currentView.image;
   var target_view   = target_window.currentView;

   target_w = target_img.width;
   target_h = target_img.height;

   // Inset
   duplicateImage( inset_image, croppedInsetClose );
   var inset_window = ImageWindow.windowById( "InsetTemp" );
   var inset_img    = inset_window.currentView.image;
   var inset_view   = inset_window.currentView;

   inset_w = inset_img.width;
   inset_h = inset_img.height;

   xMargin += borderWidth;
   yMargin += borderWidth;

   // Border Color (rgba to decimal)
   borderColor_r = Color.red( borderColor )/255.0;
   borderColor_g = Color.green( borderColor )/255.0;
   borderColor_b = Color.blue( borderColor )/255.0;
   // ----

   switch( insetPosition )
   {
      case "Top_Left":
         LM = xMargin;
         TM = yMargin;
         RM = target_w - inset_w - xMargin;
         BM = target_h - inset_h - yMargin;
         EX = "iif(x() < (" + ( xMargin - borderWidth ) + ") || x() >= (" + ( inset_w + xMargin + borderWidth ) + ") || y() < " + ( yMargin - borderWidth ) + " || y() >= (" + ( inset_h + yMargin + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Top_Right":
         LM = target_w - inset_w - xMargin;
         TM = yMargin;
         RM = xMargin;
         BM = target_h - inset_h - yMargin;
         EX = "iif(x() < (" + ( target_w - inset_w - xMargin - borderWidth ) + ") || x() >= (" + ( target_w - xMargin + borderWidth ) + ") || y() < " + ( yMargin - borderWidth ) + " || y() >= (" + ( inset_h + yMargin + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Bottom_Left":
         LM = xMargin;
         TM = target_h - inset_h - yMargin;
         RM = target_w - inset_w - xMargin;
         BM = yMargin;
         EX = "iif(x() < (" + ( xMargin - borderWidth ) + ") || x() >= (" + ( inset_w + xMargin + borderWidth ) + ") || y() < " + ( target_h - inset_h - yMargin - borderWidth ) + " || y() >= (" + ( target_h - yMargin + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Bottom_Right":
         LM = target_w - inset_w - xMargin;
         TM = target_h - inset_h - yMargin;
         RM = xMargin;
         BM = yMargin;
         EX = "iif(x() < (" + ( target_w - inset_w - xMargin - borderWidth ) + ") || x() >= (" + ( target_w - xMargin + borderWidth ) + ") || y() < " + ( target_h - inset_h - yMargin - borderWidth ) + " || y() >= (" + ( target_h - yMargin + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Center_Left":
         LM = xMargin;
         TM = Math.round(target_h/2) - Math.round(inset_h/2);
         RM = target_w - inset_w - xMargin;
         BM = Math.floor(target_h/2) - Math.round(inset_h/2);
         EX = "iif(x() < (" + ( xMargin - borderWidth ) + ") || x() >= (" + ( inset_w + xMargin + borderWidth ) + ") || y() < " + ( TM - borderWidth ) + " || y() >= (" + ( Math.floor(target_h/2) + Math.round(inset_h/2) + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Center_Right":
         LM = target_w - inset_w - xMargin;
         TM = Math.round(target_h/2) - Math.round(inset_h/2);
         RM = xMargin;
         BM = Math.floor(target_h/2) - Math.round(inset_h/2);
         EX = "iif(x() < (" + ( target_w - inset_w - xMargin - borderWidth ) + ") || x() >= (" + ( target_w - xMargin + borderWidth ) + ") || y() < " + ( TM - borderWidth ) + " || y() >= (" + ( Math.floor(target_h/2) + Math.round(inset_h/2) + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Center_Top":
         LM = Math.round(target_w/2) - Math.round(inset_w/2);
         TM = yMargin;
         RM = Math.floor(target_w/2) - Math.round(inset_w/2);
         BM = target_h - inset_h - yMargin;
         EX = "iif(x() < (" + ( LM - borderWidth ) + ") || x() >= (" + ( target_w - RM + borderWidth ) + ") || y() < " + ( yMargin - borderWidth ) + " || y() >= (" + ( inset_h + yMargin + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Center_Bottom":
         LM = Math.round(target_w/2) - Math.round(inset_w/2);
         TM = target_h - inset_h - yMargin;
         RM = Math.floor(target_w/2) - Math.round(inset_w/2);
         BM = yMargin;
         EX = "iif(x() < (" + ( LM - borderWidth ) + ") || x() >= (" + ( target_w - RM + borderWidth ) + ") || y() < " + ( target_h - inset_h - yMargin - borderWidth ) + " || y() >= (" + ( target_h - yMargin + borderWidth ) + ") , $T, InsetTemp)";
      break;
      case "Center_Center":
         LM = Math.round(target_w/2) - Math.round(inset_w/2);
         TM = Math.round(target_h/2) - Math.round(inset_h/2);
         RM = Math.floor(target_w/2) - Math.round(inset_w/2);
         BM = Math.floor(target_h/2) - Math.round(inset_h/2);
         EX = "iif(x() < (" + ( LM - borderWidth ) + ") || x() >= (" + ( target_w - RM + borderWidth ) + ") || y() < " + ( TM - borderWidth ) + " || y() >= (" + ( Math.floor(target_h/2) + Math.round(inset_h/2) + borderWidth ) + ") , $T, InsetTemp)";
      break;
   }; // switch


   // Croping the inset to target size
   var P = new Crop;
   P.leftMargin = LM;
   P.topMargin = TM;
   P.rightMargin = RM;
   P.bottomMargin = BM
   P.mode = Crop.prototype.AbsolutePixels;
   P.xResolution = 72.000;
   P.yResolution = 72.000;
   P.metric = false;
   P.forceResolution = false;
   P.red = borderColor_r;
   P.green = borderColor_g;
   P.blue = borderColor_b;
   P.alpha = 1.000000;

   inset_view.beginProcess( UndoFlag_NoSwapFile );
   P.executeOn( inset_view );
   inset_view.endProcess();
   // ----

   // PixelMath
   var pm = new PixelMath;
   with ( pm )
   {
      var P = new PixelMath;
      P.expression = EX;
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
      P.createNewImage = true;
      P.newImageId = "ImageInset";
      P.newImageWidth = 0;
      P.newImageHeight = 0;
      P.newImageAlpha = false;
      P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
      P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;
   };
   target_view.beginProcess( UndoFlag_NoSwapFile );
   P.executeOn( target_view, false );
   target_view.endProcess();

   // ----

   // Close or preserve intermediate image
   if( croppedInsetClose )
   {
      inset_window.forceClose();
   }
   else
   {
      inset_window.zoomToOptimalFit();
      inset_window.mainView.id = "InsetCropped";
   }; // if croppedInsetClose
   // ----


}; // makeInset()

// ----

// Function by Juan Conejero - Sep 17, 2007 (and modified by me - Dec 11, 2011)
// http://pixinsight.com/forum/index.php?topic=295.msg1003#msg1003
function duplicateImage( dw, dshow )
{

   var w = ImageWindow.windowById( dw );
   var v = w.mainView;

   var copy_img = new ImageWindow (
      1, 1, 1, v.image.bitsPerSample,
      v.image.sampleType == SampleType_Real,
      false, "InsetTemp" );

   with ( copy_img.mainView )
   {
       beginProcess( UndoFlag_NoSwapFile );
       image.assign( v.image );
       endProcess();
   }

   if( !dshow )
   {
      copy_img.show();
   };

};
// ----

// UI Start

var engine = new Inset;

function ii_dialog() {

   this.__base__ = Dialog;
   this.__base__();

   this.helpLabel = new Label (this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION + "</b> &mdash; Insert a small image in a larger one.";
   this.helpLabel.setScaledMinWidth( 490 );

   // Target Image Selection
   this.TargetImage_ComboBox = new ComboBox( this );
   this.TargetImage_ComboBox.setScaledMinWidth( 380 );
   var workspace_windows = ImageWindow.windows;
   with( this.TargetImage_ComboBox )
   {
      for ( var j = 0; j < workspace_windows.length; ++j )
      {
         addItem( workspace_windows[j].mainView.id );
         onItemSelected = function(j) { engine.target_image = workspace_windows[j].mainView.id; }
      } // for
      engine.target_image = workspace_windows[0].mainView.id;
   } // with
   // ----

   // Inset Image Selection
   this.InsetImage_ComboBox = new ComboBox( this );
   this.InsetImage_ComboBox.setScaledMinWidth( 380 );
   var workspace_windows = ImageWindow.windows;
   with( this.InsetImage_ComboBox )
   {
      for ( var j = 0; j < workspace_windows.length; ++j )
      {
         addItem( workspace_windows[j].mainView.id );
         onItemSelected = function(j) { engine.inset_image = workspace_windows[j].mainView.id; }
      } // for
      engine.inset_image = workspace_windows[0].mainView.id;
   } // with
   // ----

   // Image Selection Labels
   // Target
   this.TargetImage_Label = new Label (this);
   this.TargetImage_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.TargetImage_Label.margin = 6;
   this.TargetImage_Label.text = "Main Image";
   // Inset
   this.InsetImage_Label = new Label (this);
   this.InsetImage_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.InsetImage_Label.margin = 6;
   this.InsetImage_Label.text = "Inset Image";
   // ----

   this.TargetImage_Sizer = new HorizontalSizer;
   with ( this.TargetImage_Sizer )
   {
      add( this.TargetImage_Label );
      addStretch();
      add( this.TargetImage_ComboBox, 100 );
      addSpacing( 6 );
   }

   this.InsetImage_Sizer = new HorizontalSizer;
   with ( this.InsetImage_Sizer )
   {
      add( this.InsetImage_Label );
      addStretch();
      add( this.InsetImage_ComboBox, 100 );
      addSpacing( 6 );
   }

   this.Images_GroupBox = new GroupBox (this);
   this.Images_GroupBox.title = "Images Selection:";
   this.Images_GroupBox.sizer = new VerticalSizer;
   this.Images_GroupBox.sizer.addSpacing( 6 );
   this.Images_GroupBox.sizer.add ( this.TargetImage_Sizer );
   this.Images_GroupBox.sizer.spacing = 4;
   this.Images_GroupBox.sizer.add ( this.InsetImage_Sizer );
   this.Images_GroupBox.sizer.addSpacing( 6 );

   // Settings
   // Location Selection
   this.Location_ComboBox = new ComboBox( this );

   var l = new Array (
      "Top_Left",
      "Top_Right",
      "Bottom_Left",
      "Bottom_Right",
      "Center_Left",
      "Center_Right",
      "Center_Top",
      "Center_Bottom",
      "Center_Center"
   );

   with( this.Location_ComboBox )
   {
      for( var i = 0 ; i < l.length ; i++)
      {
         addItem( l[i] );
         onItemSelected = function(i) { engine.insetPosition = l[i]; }
      } // for
      currentItem = 1;
      engine.insetPosition = l[1];
   } // with

   // Margin Y
   this.yMargin_SpinBox = new SpinBox( this );
   with ( this.yMargin_SpinBox )
   {
      minValue = 0;
      maxValue = 500;
      value = DEFAULT_TB_MARGIN;
      toolTip = "Vertical margin from main image (top or bottom)";

      onValueUpdated = function( value )
      {
         engine.yMargin = value;
      };
      engine.yMargin = DEFAULT_TB_MARGIN;
   }

   // Margin X
   this.xMargin_SpinBox = new SpinBox( this );
   with ( this.xMargin_SpinBox )
   {
      minValue = 0;
      maxValue = 500;
      value = DEFAULT_RL_MARGIN;
      toolTip = "Horizontal margin from main image (left or right)";

      onValueUpdated = function( value )
      {
         engine.xMargin = value;
      };
      engine.xMargin = DEFAULT_RL_MARGIN;
   }

   // Settings Labels
   // Location
   this.Location_Label = new Label (this);
   this.Location_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.Location_Label.margin = 6;
   this.Location_Label.text = "Inset Location";
   // Vertical Margin
   this.yMargin_Label = new Label (this);
   this.yMargin_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.yMargin_Label.margin = 6;
   this.yMargin_Label.text = "Vertical Margin";
   // Horizontal Margin
   this.xMargin_Label = new Label (this);
   this.xMargin_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.xMargin_Label.margin = 6;
   this.xMargin_Label.text = "Horizontal Margin";
   // ----

   this.Settings_Sizer = new HorizontalSizer;
   with ( this.Settings_Sizer )
   {
      add( this.Location_Label );
      add( this.Location_ComboBox, 100 );
      addStretch();
      add( this.yMargin_Label );
      add( this.yMargin_SpinBox );
      addStretch();
      add( this.xMargin_Label );
      add( this.xMargin_SpinBox );
      addSpacing( 6 );
   }

   // ----

   // Border Settings

   // Border Width
   this.borderWidth_SpinBox = new SpinBox( this );
   with ( this.borderWidth_SpinBox )
   {
      minValue = 0;
      maxValue = 20;
      value = DEFAULT_BORDER_WIDTH;
      toolTip = "Border width around inset image.";

      onValueUpdated = function( value )
      {
         engine.borderWidth = value;
      };
      engine.borderWidth = DEFAULT_BORDER_WIDTH;
   }

   // Color
   this.borderColor_ComboBox = new ColorComboBox( this );
   this.borderColor_ComboBox.setCurrentColor( 0xffffffff );
   this.borderColor_ComboBox.toolTip = "Border Color.";
   this.borderColor_ComboBox.onColorSelected = function( rgba )
   {
      engine.borderColor = rgba;
   };
   engine.borderColor = 4294967295;

   // Border Settings Labels
   // Width
   this.borderWidth_Label = new Label( this );
   this.borderWidth_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.borderWidth_Label.text = "Border Width";
   this.borderWidth_Label.margin = 6;
   // Color
   this.borderColor_Label = new Label( this );
   this.borderColor_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.borderColor_Label.text = "Border color";
   this.Location_Label.margin = 6;
   // ---

   this.border_Sizer = new HorizontalSizer;
   with ( this.border_Sizer )
   {
      add( this.borderWidth_Label );
      addSpacing( 5 );
      add( this.borderWidth_SpinBox );
      addStretch();
      add( this.borderColor_Label );
      addSpacing( 6 );
      add( this.borderColor_ComboBox, 100 );
      addStretch();
   }

   // ----


   // Close Temp Cropped Inset Image
   this.croppedInsetClose_CheckBox = new CheckBox( this );
   with ( this.croppedInsetClose_CheckBox )
   {
      text = "Close intermediate image";
      checked = true;
      toolTip = "Close temporal intermediate generated cropped image. Uncheck to preserve.";

      onCheck = function( checked )
      {
         engine.croppedInsetClose = checked;
      };
      engine.croppedInsetClose = true;
   };
   // ----

   this.Options_Sizer = new HorizontalSizer;
   with ( this.Options_Sizer )
   {
      addSpacing( 6 );
      add( this.croppedInsetClose_CheckBox );
   }

   this.Settings_GroupBox = new GroupBox (this);
   this.Settings_GroupBox.title = "Inset Settings:";
   this.Settings_GroupBox.sizer = new VerticalSizer;
   this.Settings_GroupBox.sizer.addSpacing( 6 );
   this.Settings_GroupBox.sizer.add ( this.Settings_Sizer );
   this.Settings_GroupBox.sizer.addSpacing( 6 );
   this.Settings_GroupBox.sizer.add ( this.border_Sizer );
   this.Settings_GroupBox.sizer.addSpacing( 6 );
   this.Settings_GroupBox.sizer.add ( this.Options_Sizer );
   this.Settings_GroupBox.sizer.addSpacing( 6 );

   // Buttons

   this.ok_Button = new PushButton (this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function() {
      var result = engine.executeMainFunction();
      if( result )
      {
         this.dialog.cancel();
      };
   };

   this.cancel_Button = new PushButton (this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function() {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add (this.ok_Button);
   this.buttons_Sizer.add (this.cancel_Button);

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add ( this.helpLabel );
   this.sizer.addSpacing (4);
   this.sizer.add( this.Images_GroupBox );
   this.sizer.addSpacing (4);
   this.sizer.add( this.Settings_GroupBox );
   this.sizer.addSpacing (4);
   this.sizer.add ( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script v" + VERSION;
   this.adjustToContents();

}

ii_dialog.prototype = new Dialog;

// UI End

function main()
{

   console.hide();
   var window = ImageWindow.activeWindow;

   if ( window.isNull )
   {
      console.show();
      console.writeln("\n<b>Error:</b> No active images.");
   }
   else
   {
      var dialog = new ii_dialog();
      dialog.execute();
   }

}; // main()

main();
