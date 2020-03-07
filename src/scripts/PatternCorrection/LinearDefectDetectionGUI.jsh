// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// LinearDefectDetectionGUI.jsh - Released 2019-12-23T12:01:37Z
// ----------------------------------------------------------------------------
//
// Pattern Correction Scripts
//
// Copyright (c) 2019 Vicent Peris (OAUV). All Rights Reserved.
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

#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>

function LDDDialog( parameters )
{
   this.__base__ = Dialog;
   this.__base__();

   //

   this.parameters = parameters;

   //

   let emWidth = this.font.width( 'M' );
   let labelWidth1 = this.font.width( "Detection threshold, partial lines:" ) + emWidth;
   let editWidth2 = 6*emWidth;

   //

   this.helpLabel = new Label( this );
   this.helpLabel.styleSheet = this.scaledStyleSheet(
         "QWidget#" + this.helpLabel.uniqueId + " {"
      +     "border: 1px solid gray;"
      +     "padding: 0.25em;"
      +  "}" );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><strong>" + TITLE + " script version " + VERSION + "</strong><br/>"
      + "Script to detect defective columns or rows in a reference image.<br/>"
      + "Copyright &copy; 2019 Vicent Peris (OAUV).</p>";

   //

   this.closeFormerWorkingImages_CheckBox = new CheckBox( this );
   this.closeFormerWorkingImages_CheckBox.text = "Close former working images";
   this.closeFormerWorkingImages_CheckBox.toolTip =
         "<p>When running the script multiple times on the active image, "
       + "you can choose to automatically close the working images from the "
       + "previous run by checking this option. In such case only the target "
       + "image will remain open.</p>";
   this.closeFormerWorkingImages_CheckBox.onClick = function( checked )
   {
      this.dialog.parameters.closeFormerWorkingImages = checked;
   };

   this.closeFormerWorkingImages_Sizer = new HorizontalSizer;
   this.closeFormerWorkingImages_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.closeFormerWorkingImages_Sizer.add( this.closeFormerWorkingImages_CheckBox );
   this.closeFormerWorkingImages_Sizer.addStretch();

   //

   this.detectColumns_CheckBox = new CheckBox( this );
   this.detectColumns_CheckBox.text = "Detect columns";
   this.detectColumns_CheckBox.toolTip =
         "<p>Enable this option if you want to correct a column pattern; "
       + "disable it to correct a row pattern.</p>";
   this.detectColumns_CheckBox.onClick = function( checked )
   {
      this.dialog.parameters.detectColumns = checked;
      this.dialog.updateControls();
   };

   this.detectColumns_Sizer = new HorizontalSizer;
   this.detectColumns_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.detectColumns_Sizer.add( this.detectColumns_CheckBox );
   this.detectColumns_Sizer.addStretch();

   //

   this.detectPartialLines_CheckBox = new CheckBox( this );
   this.detectPartialLines_CheckBox.text = "Detect partial lines";
   this.detectPartialLines_CheckBox.toolTip =
         "<p>Enable this option to detect lines shorter than the width or "
       + "height of the image.</p>";
   this.detectPartialLines_CheckBox.onClick = function( checked )
   {
      this.dialog.parameters.detectPartialLines = checked;
      this.dialog.updateControls();
   };

   this.detectPartialLines_Sizer = new HorizontalSizer;
   this.detectPartialLines_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.detectPartialLines_Sizer.add( this.detectPartialLines_CheckBox );
   this.detectPartialLines_Sizer.addStretch();

   //

   let toolTipLayersToRemove =
         "<p>The algorithm isolates column or row structures from large-scale "
       + "image structures, which are computed using multiscale transforms. "
       + "This parameter defines a size in pixels to separate small-scale and "
       + "large-scale structures, using a dyadic sequence. Thus, the default "
       + "value of 9 means that all structures at the scale of 2<sup>8</sup> "
       + "pixels (256) and larger will be removed from the image, keeping in "
       + "the resulting small-scale component image the structures with sizes "
       + "from 1 to 128 pixels.</p>";

   this.layersToRemove_Label = new Label( this );
   this.layersToRemove_Label.text = "Layers to remove:";
   this.layersToRemove_Label.toolTip = toolTipLayersToRemove;
   this.layersToRemove_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.layersToRemove_Label.setFixedWidth( labelWidth1 );

   this.layersToRemove_SpinBox = new SpinBox( this );
   this.layersToRemove_SpinBox.setRange( 7, 15 );
   this.layersToRemove_SpinBox.setFixedWidth( editWidth2 );
   this.layersToRemove_SpinBox.toolTip = toolTipLayersToRemove
   this.layersToRemove_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.layersToRemove = value;
   }

   this.layersToRemove_Sizer = new HorizontalSizer;
   this.layersToRemove_Sizer.spacing = 4;
   this.layersToRemove_Sizer.add( this.layersToRemove_Label );
   this.layersToRemove_Sizer.add( this.layersToRemove_SpinBox );
   this.layersToRemove_Sizer.addStretch();

   //

   let toolTipRejectionLimit =
         "<p>Threshold to perform a bright pixel rejection in each column or "
       + "row of the small-scale component image. This will ensure a precise "
       + "calculation of statistics in each column or row, without a bias "
       + "toward bright pixels. The value is expressed in sigma units with "
       + "respect to background noise.</p>";

   this.rejectionLimit_Label = new Label( this );
   this.rejectionLimit_Label.text = "Rejection limit:";
   this.rejectionLimit_Label.toolTip = toolTipRejectionLimit;
   this.rejectionLimit_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.rejectionLimit_Label.setFixedWidth( labelWidth1 );

   this.rejectionLimit_SpinBox = new SpinBox( this );
   this.rejectionLimit_SpinBox.setRange( 0, 15 );
   this.rejectionLimit_SpinBox.setFixedWidth( editWidth2 );
   this.rejectionLimit_SpinBox.toolTip = toolTipRejectionLimit
   this.rejectionLimit_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.rejectionLimit = value;
   }

   this.rejectionLimit_Sizer = new HorizontalSizer;
   this.rejectionLimit_Sizer.spacing = 4;
   this.rejectionLimit_Sizer.add( this.rejectionLimit_Label );
   this.rejectionLimit_Sizer.add( this.rejectionLimit_SpinBox );
   this.rejectionLimit_Sizer.addStretch();

   //

   let toolTipDetectionThreshold =
         "<p>The linear defect detection is driven by a detection threshold "
       + "in sigma units of the background area noise. A lower value will "
       + "detect more lines.</p>";

   this.detectionThreshold_Label = new Label( this );
   this.detectionThreshold_Label.text = "Detection threshold, entire lines:";
   this.detectionThreshold_Label.toolTip = toolTipDetectionThreshold;
   this.detectionThreshold_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.detectionThreshold_Label.setFixedWidth( labelWidth1 );

   this.detectionThreshold_SpinBox = new SpinBox( this );
   this.detectionThreshold_SpinBox.setRange( 0, 15 );
   this.detectionThreshold_SpinBox.setFixedWidth( editWidth2 );
   this.detectionThreshold_SpinBox.toolTip = toolTipDetectionThreshold
   this.detectionThreshold_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.detectionThreshold = value;
   }

   this.detectionThreshold_Sizer = new HorizontalSizer;
   this.detectionThreshold_Sizer.spacing = 4;
   this.detectionThreshold_Sizer.add( this.detectionThreshold_Label );
   this.detectionThreshold_Sizer.add( this.detectionThreshold_SpinBox );
   this.detectionThreshold_Sizer.addStretch();

   //

   let toolTipPartialLineDetectionThreshold =
         "<p>The linear defect detection is driven by a detection threshold "
       + "in sigma units of the background area noise. A lower value will "
       + "detect more lines.</p>";

   this.partialLineDetectionThreshold_Label = new Label( this );
   this.partialLineDetectionThreshold_Label.text = "Detection threshold, partial lines:";
   this.partialLineDetectionThreshold_Label.toolTip = toolTipPartialLineDetectionThreshold;
   this.partialLineDetectionThreshold_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.partialLineDetectionThreshold_Label.setFixedWidth( labelWidth1 );

   this.partialLineDetectionThreshold_SpinBox = new SpinBox( this );
   this.partialLineDetectionThreshold_SpinBox.setRange( 0, 15 );
   this.partialLineDetectionThreshold_SpinBox.setFixedWidth( editWidth2 );
   this.partialLineDetectionThreshold_SpinBox.toolTip = toolTipPartialLineDetectionThreshold
   this.partialLineDetectionThreshold_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.partialLineDetectionThreshold = value;
   }

   this.partialLineDetectionThreshold_Sizer = new HorizontalSizer;
   this.partialLineDetectionThreshold_Sizer.spacing = 4;
   this.partialLineDetectionThreshold_Sizer.add( this.partialLineDetectionThreshold_Label );
   this.partialLineDetectionThreshold_Sizer.add( this.partialLineDetectionThreshold_SpinBox );
   this.partialLineDetectionThreshold_Sizer.addStretch();

   //

   let toolTipImageShift =
         "<p>The partial line defect detection algorithm works by shifting "
       + "a clone of the target image and subtracting one from the other. This "
       + "leaves short lines in the image that point to the origin of the "
       + "defects. A too small value will confuse these lines with residual "
       + "noise in the processed image. Usually a value between 50 and 100 "
       + "works fine.</p>";

   this.imageShift_Label = new Label( this );
   this.imageShift_Label.text = "Image shift:";
   this.imageShift_Label.toolTip = toolTipImageShift;
   this.imageShift_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.imageShift_Label.setFixedWidth( labelWidth1 );

   this.imageShift_SpinBox = new SpinBox( this );
   this.imageShift_SpinBox.setRange( 0, 100 );
   this.imageShift_SpinBox.setFixedWidth( editWidth2 );
   this.imageShift_SpinBox.toolTip = toolTipImageShift
   this.imageShift_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.imageShift = value;
   }

   this.imageShift_Sizer = new HorizontalSizer;
   this.imageShift_Sizer.spacing = 4;
   this.imageShift_Sizer.add( this.imageShift_Label );
   this.imageShift_Sizer.add( this.imageShift_SpinBox );
   this.imageShift_Sizer.addStretch();

   //

   let toolTipOutputDir =
         "<p>The directory where the output text file will be generated. "
       + "If this field is left blank, no output file will be created and the "
       + "list of defects will only be written to the console.</p>";

   this.outputDir_Label = new Label( this );
   this.outputDir_Label.text = "Output directory:";
   this.outputDir_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.outputDir_Label.minWidth = labelWidth1;
   this.outputDir_Label.toolTip = toolTipOutputDir;

   this.outputDir_Edit = new Edit( this );
   this.outputDir_Edit.toolTip = toolTipOutputDir;

   this.outputDir_Edit.onEditCompleted = function()
   {
      let dir = File.windowsPathToUnix( this.text.trim() );
      if ( dir.endsWith( '/' ) )
         dir = dir.substring( 0, dir.length-1 );
      this.text = this.dialog.parameters.outputDir = dir;
   };

   this.outputDir_Edit.onGetFocus = function()
   {
      this.text = this.text.trim();
   };

   this.outputDir_Edit.onLoseFocus = function()
   {
      this.text = this.text.trim();
   };

   this.outputDirClear_Button = new ToolButton( this );
   this.outputDirClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.outputDirClear_Button.setScaledFixedSize( 20, 20 );
   this.outputDirClear_Button.toolTip = "<p>Clear the output directory.</p>";
   this.outputDirClear_Button.onClick = function()
   {
      this.dialog.outputDir_Edit.clear();
      this.dialog.outputDir_Edit.onEditCompleted();
   };

   this.outputDirSelect_Button = new ToolButton( this );
   this.outputDirSelect_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.outputDirSelect_Button.setScaledFixedSize( 20, 20 );
   this.outputDirSelect_Button.toolTip = "<p>Select the output directory.</p>";
   this.outputDirSelect_Button.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.initialPath = this.dialog.parameters.outputDir;
      gdd.caption = "Select Output Directory";
      if ( gdd.execute() )
      {
         let dir = gdd.directory;
         if ( dir.endsWith( '/' ) )
            dir = dir.substring( 0, dir.length-1 );
         this.dialog.outputDir_Edit.text = this.dialog.parameters.outputDir = dir;
      }
   };

   this.outputDir_Sizer = new HorizontalSizer;
   this.outputDir_Sizer.add( this.outputDir_Label );
   this.outputDir_Sizer.addSpacing( 4 );
   this.outputDir_Sizer.add( this.outputDir_Edit, 100 );
   this.outputDir_Sizer.addSpacing( 4 );
   this.outputDir_Sizer.add( this.outputDirClear_Button );
   this.outputDir_Sizer.addSpacing( 2 );
   this.outputDir_Sizer.add( this.outputDirSelect_Button );

   //





   //

   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 24, 24 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      this.pushed = false;
      this.dialog.parameters.export();
      this.dialog.newInstance();
   };

   this.reset_Button = new PushButton( this );
   this.reset_Button.text = "Reset";
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.toolTip = "<p>Reset all script options to factory-default settings.</p>";
   this.reset_Button.onClick = function()
   {
      this.dialog.parameters.reset();
      this.dialog.updateControls();
   };

   this.run_Button = new PushButton( this );
   this.run_Button.text = "Run";
   this.run_Button.icon = this.scaledResource( ":/icons/power.png" );
   this.run_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.exit_Button = new PushButton( this );
   this.exit_Button.text = "Exit";
   this.exit_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.exit_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 8;
   this.buttons_Sizer.add( this.newInstance_Button );
   this.buttons_Sizer.add( this.reset_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.run_Button );
   this.buttons_Sizer.add( this.exit_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.closeFormerWorkingImages_Sizer );
   this.sizer.add( this.detectColumns_Sizer );
   this.sizer.add( this.detectPartialLines_Sizer );
   this.sizer.add( this.layersToRemove_Sizer );
   this.sizer.add( this.rejectionLimit_Sizer );
   this.sizer.add( this.detectionThreshold_Sizer );
   this.sizer.add( this.partialLineDetectionThreshold_Sizer );
   this.sizer.add( this.imageShift_Sizer );
   this.sizer.add( this.outputDir_Sizer );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE;

   this.setScaledMinWidth( 600 );
   this.adjustToContents();
   this.setFixedSize();

   //

   this.updateControls = function()
   {
      this.closeFormerWorkingImages_CheckBox.checked = this.parameters.closeFormerWorkingImages;
      this.detectColumns_CheckBox.checked = this.parameters.detectColumns;
      this.detectPartialLines_CheckBox.checked = this.parameters.detectPartialLines;
      this.layersToRemove_SpinBox.value = this.parameters.layersToRemove;
      this.rejectionLimit_SpinBox.value = this.parameters.rejectionLimit;
      this.detectionThreshold_SpinBox.value = this.parameters.detectionThreshold;
      this.partialLineDetectionThreshold_SpinBox.value = this.parameters.partialLineDetectionThreshold;
      this.imageShift_SpinBox.value = this.parameters.imageShift;
      this.outputDir_Edit.text = this.parameters.outputDir;
   };

   this.updateControls();
}

LDDDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF LinearDefectDetectionGUI.jsh - Released 2019-12-23T12:01:37Z
