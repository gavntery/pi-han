/*
   LinearPatternGeneration

   Script that lets you generate a linear pattern based on comma separated values
   on the [0.0-1.0] range, one pattern for each RGB channel.

   Written by Enzo De Bernardini (PixInsight user)

   This program is distributed in the hope that it will be useful, but WITHOUT
   ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
   FITNESS FOR A PARTICULAR PURPOSE.

*/

#feature-id     Render > LinearPatternGeneration

#feature-info   <p>Linear Pattern Generation.</p>\
                <p>Written by <b>Enzo De Bernardini</b> (PixInsight user)</p>\

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>

#define  DEBUG  false
#define  Zoom   10

#define VERSION "1.1.0"
#define TITLE   "LinearPatternGeneration"

/*
   Changelog:
   1.1.1: Change submenu Utilities to Render
   1.1.0: Export/Import parameters, selection of pattern direction
   1.0.0: First release.
*/

function pattern() {

   var inputPattern_r, inputPattern_g, inputPattern_b;
   var img_w, img_h;

   this.initialize = function() {

      // Default parameters
      this.inputPattern_r = "1,0,0,0";
      this.inputPattern_g = "0,1,0,0";
      this.inputPattern_b = "0,0,1,0";
      this.img_w          = "640";
      this.img_h          = "480";
      this.direction      = "Vertical";
      //

      if( DEBUG ) {
         console.writeln( "\n" );
         console.writeln( "<b>Default Values:</b>" );
         console.writeln( "R: " + this.inputPattern_r );
         console.writeln( "G: " + this.inputPattern_g );
         console.writeln( "B: " + this.inputPattern_b );
         console.writeln( "Width: " + this.img_w + "px" );
         console.writeln( "Height: " + this.img_h + "px" );
         console.writeln( "\n" );
      };

      if ( Parameters.isViewTarget || Parameters.isGlobalTarget ) {
         // Get parameters
         if ( Parameters.has( "inputPattern_r" ) )
            this.inputPattern_r = Parameters.getString( "inputPattern_r" );
         if ( Parameters.has( "inputPattern_g" ) )
            this.inputPattern_g = Parameters.getString( "inputPattern_g" );
         if ( Parameters.has( "inputPattern_b" ) )
            this.inputPattern_b = Parameters.getString( "inputPattern_b" );
         if ( Parameters.has( "img_w" ) )
            this.img_w = Parameters.getString( "img_w" );
         if ( Parameters.has( "img_h" ) )
            this.img_h = Parameters.getString( "img_h" );
         if ( Parameters.has( "direction" ) )
            this.direction = Parameters.getString( "direction" );

         if( DEBUG ) {
            console.writeln( "<b>Loaded Parameters:</b>" );
            console.writeln( "R: " + this.inputPattern_r );
            console.writeln( "G: " + this.inputPattern_g );
            console.writeln( "B: " + this.inputPattern_b );
            console.writeln( "W: " + this.img_w );
            console.writeln( "H: " + this.img_h );
            console.writeln( "D: " + this.direction );
            console.writeln( "\n" );
         };

      }; // if

   }; // initialize()


   this.makePattern = function() {

      var window = new ImageWindow( parseFloat(this.img_w), parseFloat(this.img_h), 3, 32, true, true );
      var view   = window.mainView;
      var img    = view.image;

      var x, y, p, PV_Long;

      var width  = this.img_w;
      var height = this.img_h;

      window.show();
      window.zoomFactor = Zoom;

      // Spliting comma separated values
      var PValues_r_array = this.inputPattern_r.split(",");
      var PValues_g_array = this.inputPattern_g.split(",");
      var PValues_b_array = this.inputPattern_b.split(",");
      //

      if( DEBUG ) {
         console.writeln( "R: " + PValues_r_array );
         console.writeln( "G: " + PValues_g_array );
         console.writeln( "B: " + PValues_b_array );
         console.writeln( "\n" );
      };

      // Determination of the most populated array
      if(PValues_r_array.length == PValues_g_array.length && PValues_r_array.length == PValues_b_array.length && PValues_g_array.length == PValues_b_array.length) {
         PV_Long = PValues_r_array.length;
      } else {
         if(PValues_r_array.length >= PValues_g_array.length && PValues_r_array.length >= PValues_b_array.length) {
            PV_Long = PValues_r_array.length;
         };
         if(PValues_g_array.length >= PValues_r_array.length && PValues_g_array.length >= PValues_b_array.length) {
            PV_Long = PValues_g_array.length;
         };
         if(PValues_b_array.length >= PValues_r_array.length && PValues_b_array.length >= PValues_g_array.length) {
            PV_Long = PValues_b_array.length;
         };
      };

      if( DEBUG ) {
         console.writeln( "R Elements:" + PValues_r_array.length );
         console.writeln( "G Elements:" + PValues_g_array.length );
         console.writeln( "B Elements:" + PValues_b_array.length );
         console.writeln( "Max: " + PV_Long + " elements" );
         console.writeln( "\n" );
      };

      //

      view.beginProcess( UndoFlag_NoSwapFile ); // do not generate any swap file

      // Pattern Making
      switch( this.direction ) {
         case "Vertical":
            // y values
            for( y = 0; y < height; y++) {
               // X Values
               for ( x = 0; x < width; x++ ) {
                  for( p = 0; p < PV_Long; p++) {
                     img.setSample( parseFloat( PValues_r_array[p] ), x, y, 0); // R
                     img.setSample( parseFloat( PValues_g_array[p] ), x, y, 1); // G
                     img.setSample( parseFloat( PValues_b_array[p] ), x, y, 2); // B
                     if( p + 1 != PV_Long && x + 1 < width) {
                        x++;
                     } else {
                        break;
                     };
                  };
               };
            };
         break;
         case "Horizontal":
            // x values
            for( x = 0; x < width; x++) {
               // y Values
               for ( y = 0; y < height; y++ ) {
                  for( p = 0; p < PV_Long; p++) {
                     img.setSample( parseFloat( PValues_r_array[p] ), x, y, 0); // R
                     img.setSample( parseFloat( PValues_g_array[p] ), x, y, 1); // G
                     img.setSample( parseFloat( PValues_b_array[p] ), x, y, 2); // B
                     if( p + 1 != PV_Long && y + 1 < height) {
                        y++;
                     } else {
                        break;
                     };
                  };
               };
            };
         break;
      }; // switch
      // --

      view.endProcess();
   }; // makeParttern()

   // Actual Image Sizes
   this.actualImage = function() {
      if ( Parameters.isViewTarget || Parameters.isGlobalTarget ) {
         return Array( img_w, img_h);
      } else {
         var window = ImageWindow.activeWindow;
         if ( !window.isNull ) {
            var image = window.currentView.image
            var image_w = image.width;
            var image_h = image.height;
            return Array( image_w, image_h);
         } else {
            return Array( 0, 0 );
         }
      }
   }; // actualImage()

   // Export Current Settings
   this.exportParameters = function() {
      Parameters.set( "inputPattern_r", this.inputPattern_r );
      Parameters.set( "inputPattern_g", this.inputPattern_g );
      Parameters.set( "inputPattern_b", this.inputPattern_b );
      Parameters.set( "img_w", this.img_w );
      Parameters.set( "img_h", this.img_h );
      Parameters.set( "direction", this.direction );
   }; // exportParameters()
   //

   this.initialize();

};

var engine = new pattern;

function PatternDialog() {

   // Add all properties and methods of the core Dialog object to this object.
   this.__base__ = Dialog;
   this.__base__();

   this.infoLabel = new Label( this );
   this.infoLabel.frameStyle = FrameStyle_Flat;
   this.infoLabel.margin = 2;
   this.infoLabel.wordWrapping = true;
   this.infoLabel.useRichText = true;
   this.infoLabel.text = "<p>Comma separated values [0.0-1.0 range]</p>";
   //

   // Input Pattern R
   this.inputPattern_r_Label = new Label( this );
   this.inputPattern_r_Label.text = "R:";
   this.inputPattern_r_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.inputPattern_r_Label.toolTip = "Red channel pattern (comma separated values)";

   this.inputPattern_r = new Edit( this );
   this.inputPattern_r.setScaledMinWidth( 400 );
   this.inputPattern_r.text = engine.inputPattern_r;

   this.inputPattern_r.onEditCompleted = function() {
      engine.inputPattern_r = this.text;
   };

   this.pattern_r_Sizer = new HorizontalSizer;
   this.pattern_r_Sizer.spacing = 4;
   this.pattern_r_Sizer.add( this.inputPattern_r_Label );
   this.pattern_r_Sizer.addStretch();
   this.pattern_r_Sizer.add( this.inputPattern_r );
   this.pattern_r_Sizer.addStretch();

   //

   // Input Pattern G
   this.inputPattern_g_Label = new Label( this );
   this.inputPattern_g_Label.text = "G:";
   this.inputPattern_g_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.inputPattern_g_Label.toolTip = "Green channel pattern (comma separated values)";

   this.inputPattern_g = new Edit( this );
   this.inputPattern_g.setScaledMinWidth( 400 );
   this.inputPattern_g.text = engine.inputPattern_g;

   this.inputPattern_g.onEditCompleted = function() {
      engine.inputPattern_g = this.text;
   };

   this.pattern_g_Sizer = new HorizontalSizer;
   this.pattern_g_Sizer.spacing = 4;
   this.pattern_g_Sizer.add( this.inputPattern_g_Label );
   this.pattern_g_Sizer.addStretch();
   this.pattern_g_Sizer.add( this.inputPattern_g );
   this.pattern_g_Sizer.addStretch();

   //

   // Input Pattern B
   this.inputPattern_b_Label = new Label( this );
   this.inputPattern_b_Label.text = "B:";
   this.inputPattern_b_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.inputPattern_b_Label.toolTip = "Blue channel pattern (comma separated values)";

   this.inputPattern_b = new Edit( this );
   this.inputPattern_b.setScaledMinWidth( 400 );
   this.inputPattern_b.text = engine.inputPattern_b;

   this.inputPattern_b.onEditCompleted = function() {
      engine.inputPattern_b = this.text;
   };

   this.pattern_b_Sizer = new HorizontalSizer;
   this.pattern_b_Sizer.spacing = 4;
   this.pattern_b_Sizer.add( this.inputPattern_b_Label );
   this.pattern_b_Sizer.addStretch();
   this.pattern_b_Sizer.add( this.inputPattern_b );
   this.pattern_b_Sizer.addStretch();

   //

   this.pattern_sizer = new VerticalSizer;
   this.pattern_sizer.add( this.infoLabel );
   this.pattern_sizer.addSpacing( 10 );
   this.pattern_sizer.add( this.pattern_r_Sizer );
   this.pattern_sizer.addSpacing( 4 );
   this.pattern_sizer.add( this.pattern_g_Sizer );
   this.pattern_sizer.addSpacing( 4 );
   this.pattern_sizer.add( this.pattern_b_Sizer );
   this.pattern_sizer.addSpacing( 4 );

   this.pattern_GroupBox = new GroupBox( this );
   this.pattern_GroupBox.title = "Pattern Expressions";
   this.pattern_GroupBox.sizer = new HorizontalSizer;
   this.pattern_GroupBox.sizer.margin = 4;
   this.pattern_GroupBox.sizer.spacing = 4;
   this.pattern_GroupBox.sizer.add( this.pattern_sizer, 100 );

   //

   var img_actual = engine.actualImage();

   // Image Size
   this.img_w_Label = new Label( this );
   this.img_w_Label.text = "Width:";
   this.img_w_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.img_w_Label.toolTip = "Image Width";

   this.img_w = new Edit( this );
   this.img_w.setScaledFixedWidth( 60 );
   if(img_actual[0] > 0) {
      this.img_w.text = img_actual[0] + "";
   } else {
      this.img_w.text = engine.img_w;
   };

   engine.img_w = this.img_w.text;

   this.img_w.onEditCompleted = function() {
      engine.img_w = this.text;
   };

   this.img_w_Sizer = new HorizontalSizer;
   this.img_w_Sizer.spacing = 4;
   this.img_w_Sizer.add( this.img_w_Label );
   this.img_w_Sizer.add( this.img_w );
   this.img_w_Sizer.addStretch();

   this.img_h_Label = new Label( this );
   this.img_h_Label.text = "Height:";
   this.img_h_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.img_h_Label.toolTip = "Image Height";

   this.img_h = new Edit( this );
   this.img_h.setScaledFixedWidth( 60 );
   this.img_h.text = engine.img_h;

   if(img_actual[1] > 0) {
      this.img_h.text = img_actual[1] + "";
   } else {
      this.img_h.text = engine.img_h;
   };

   engine.img_h = this.img_h.text;

   this.img_h.onEditCompleted = function() {
      engine.img_h = this.text;
   };

   this.img_h_Sizer = new HorizontalSizer;
   this.img_h_Sizer.spacing = 4;
   this.img_h_Sizer.add( this.img_h_Label );
   this.img_h_Sizer.add( this.img_h );
   this.img_h_Sizer.addStretch();

   //

   // Pattern direction
   this.direction_Label = new Label( this );
   this.direction_Label.text = "Direction:";
   this.direction_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.direction = new ComboBox( this );
   this.direction.addItem( "Vertical" );
   this.direction.addItem( "Horizontal" );
   this.direction.editEnabled = false;
   this.direction.scaledMinWidth = 100;
   switch( engine.direction ) {
      case "Vertical"   : this.direction.currentItem = 0; break;
      case "Horizontal" : this.direction.currentItem = 1; break;
   };
   this.direction.onItemSelected = function( index ) {
      engine.direction = this.itemText( index );
   };

   this.patternDirection = new HorizontalSizer;
   this.patternDirection.spacing = 4;
   this.patternDirection.add( this.direction_Label );
   this.patternDirection.add( this.direction );
   this.patternDirection.addStretch();

   //

   this.img_d_Sizer = new HorizontalSizer;
   this.img_d_Sizer.spacing = 4;
   this.img_d_Sizer.add( this.img_w_Sizer );
   this.img_d_Sizer.addStretch();
   this.img_d_Sizer.add( this.img_h_Sizer );
   this.img_d_Sizer.addStretch();
   this.img_d_Sizer.add( this.patternDirection );

   //

   this.dimensions_GroupBox = new GroupBox( this );
   this.dimensions_GroupBox.title = "Output Properties";
   this.dimensions_GroupBox.sizer = new HorizontalSizer;
   this.dimensions_GroupBox.sizer.margin = 4;
   this.dimensions_GroupBox.sizer.spacing = 4;
   this.dimensions_GroupBox.sizer.add( this.img_d_Sizer, 100 );

   //

   // New Instance button
   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 24, 24 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function() {
      this.hasFocus = true;
      this.pushed = false;
      engine.exportParameters();
      this.dialog.newInstance();
   };

   //

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function() {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function() {
      this.dialog.cancel();
   };

   //

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add( this.newInstance_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.pattern_GroupBox );
   this.sizer.add( this.dimensions_GroupBox );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.userResizable = true;
   this.adjustToContents();

};

// Our dialog inherits all properties and methods from the core Dialog object.
PatternDialog.prototype = new Dialog;

function main() {

   if( DEBUG ) {
      console.show();
   } else {
      console.hide();
   };

   // Show our dialog box, quit if cancelled.
   var dialog = new PatternDialog();
   //if ( Parameters.isGlobalTarget || Parameters.isViewTarget ) {
   //   engine.importParameters();
   //};
   for ( ;; ) {
      if ( dialog.execute() ) {
         console.abortEnabled = true;
         engine.makePattern();
      };
      break;
   };
};

main();
