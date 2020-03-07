// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// LinearPatternSubtractionGUI.jsh - Released 2019-12-23T12:01:37Z
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

function LPSDialog( parameters )
{
   this.__base__ = Dialog;
   this.__base__();

   //

   this.parameters = parameters;

   //

   let emWidth = this.font.width( 'M' );
   let labelWidth1 = this.font.width( "Background reference region:" ) + emWidth;
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
      + "Script to correct residual column or row patterns in a list of images.<br/>"
      + "Copyright &copy; 2019 Vicent Peris (OAUV).</p>";

   //

   this.files_TreeBox = new TreeBox( this );
   this.files_TreeBox.multipleSelection = true;
   this.files_TreeBox.rootDecoration = false;
   this.files_TreeBox.alternateRowColor = true;
   this.files_TreeBox.setScaledMinSize( 600, 120 );
   this.files_TreeBox.numberOfColumns = 1;
   this.files_TreeBox.headerVisible = false;

   this.filesAdd_Button = new PushButton( this );
   this.filesAdd_Button.text = "Add Files";
   this.filesAdd_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.filesAdd_Button.toolTip = "<p>Add image files to the list.</p>";

   this.filesAdd_Button.onClick = function()
   {
      let ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select Input Image Files";
      ofd.loadImageFilters();

      if ( ofd.execute() )
      {
         let newFiles = 0;
         for ( let i = 0; i < ofd.fileNames.length; ++i )
            if ( this.dialog.parameters.inputFiles.indexOf( ofd.fileNames[i] ) < 0 )
            {
               if ( ++newFiles == 1 )
                  this.dialog.files_TreeBox.canUpdate = false;
               let node = new TreeBoxNode( this.dialog.files_TreeBox );
               node.setText( 0, ofd.fileNames[i] );
               this.dialog.parameters.inputFiles.push( ofd.fileNames[i] );
            }
         if ( newFiles > 0 )
         {
            this.dialog.files_TreeBox.canUpdate = true;
            if ( newFiles < ofd.fileNames.length )
               (new MessageBox( format( "<p>Only %d files (out of %d) have been added to the input list; %d files were already selected.</p>",
                                        newFiles, ofd.fileNames.length, ofd.fileNames.length-newFiles ),
                                TITLE, StdIcon_Warning, StdButton_Ok )).execute();
         }
         else
            (new MessageBox( "<p>No files have been added to the input list: all of the specified files were already selected.</p>",
                             TITLE, StdIcon_Warning, StdButton_Ok )).execute();
      }
   };

   this.filesAddDirectory_Button = new PushButton( this );
   this.filesAddDirectory_Button.text = "Add Directory";
   this.filesAddDirectory_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.filesAddDirectory_Button.toolTip = "<p>Recursively search a directory tree and add all image files found to the list.</p>";

   this.filesAddDirectory_Button.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.caption = "Select Input Directory";
      if ( gdd.execute() )
      {
         let baseDirectory = File.fullPath( gdd.directory );
         if ( baseDirectory[baseDirectory.length-1] == '/' ) // remove a terminating slash
            if ( baseDirectory != "/" )
               baseDirectory.slice( baseDirectory.length-1, -1 );

         let sourceFiles = searchDirectory( baseDirectory + "/*.xisf", true/*recursive*/ );
         if ( sourceFiles.length > 0 )
         {
            let newFiles = 0;
            for ( let i = 0; i < sourceFiles.length; ++i )
               if ( this.dialog.parameters.inputFiles.indexOf( sourceFiles[i] ) < 0 )
               {
                  if ( ++newFiles == 1 )
                     this.dialog.files_TreeBox.canUpdate = false;
                  let node = new TreeBoxNode( this.dialog.files_TreeBox );
                  node.setText( 0, sourceFiles[i] );
                  this.dialog.parameters.inputFiles.push( sourceFiles[i] );
               }
            if ( newFiles > 0 )
            {
               this.dialog.files_TreeBox.canUpdate = true;
               if ( newFiles < sourceFiles.length )
                  (new MessageBox( format( "<p>Only %d files (out of %d) have been added to the input list; %d files were already selected.</p>",
                                           newFiles, sourceFiles.length, sourceFiles.length-newFiles ),
                                   TITLE, StdIcon_Warning, StdButton_Ok )).execute();
            }
            else
               (new MessageBox( "<p>No files have been added to the input list: all of the files found were already selected.</p>",
                                TITLE, StdIcon_Warning, StdButton_Ok )).execute();
         }
         else
            (new MessageBox( "<p>No image files were found on the specified directory:</p>" +
                             "<p>" + baseDirectory + "</p>",
                             TITLE, StdIcon_Warning, StdButton_Ok )).execute();
      }
   };

   this.filesClear_Button = new PushButton( this );
   this.filesClear_Button.text = "Clear";
   this.filesClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.filesClear_Button.toolTip = "<p>Clear the list of input files.</p>";

   this.filesClear_Button.onClick = function()
   {
      this.dialog.files_TreeBox.clear();
      this.dialog.parameters.inputFiles = new Array;
   };

   this.filesInvert_Button = new PushButton( this );
   this.filesInvert_Button.text = "Invert Selection";
   this.filesInvert_Button.icon = this.scaledResource( ":/icons/select-invert.png" );
   this.filesInvert_Button.toolTip = "<p>Invert the current selection of input files.</p>";

   this.filesInvert_Button.onClick = function()
   {
      for ( let i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         this.dialog.files_TreeBox.child( i ).selected =
               !this.dialog.files_TreeBox.child( i ).selected;
   };

   this.filesRemove_Button = new PushButton( this );
   this.filesRemove_Button.text = "Remove Selected";
   this.filesRemove_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.filesRemove_Button.toolTip = "<p>Remove all selected files from the list.</p>";

   this.filesRemove_Button.onClick = function()
   {
      this.dialog.parameters.inputFiles = new Array;
      for ( let i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         if ( !this.dialog.files_TreeBox.child( i ).selected )
            this.dialog.parameters.inputFiles.push( this.dialog.files_TreeBox.child( i ).text( 0 ) );
      for ( let i = this.dialog.files_TreeBox.numberOfChildren; --i >= 0; )
         if ( this.dialog.files_TreeBox.child( i ).selected )
            this.dialog.files_TreeBox.remove( i );
   };

   this.filesButtons_Sizer = new HorizontalSizer;
   this.filesButtons_Sizer.spacing = 8;
   this.filesButtons_Sizer.add( this.filesAdd_Button );
   this.filesButtons_Sizer.add( this.filesAddDirectory_Button );
   this.filesButtons_Sizer.addSpacing( 8 );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesClear_Button );
   this.filesButtons_Sizer.addSpacing( 8 );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesInvert_Button );
   this.filesButtons_Sizer.add( this.filesRemove_Button );

   this.files_GroupBox = new GroupBox( this );
   this.files_GroupBox.title = "Input Files";
   this.files_GroupBox.sizer = new VerticalSizer;
   this.files_GroupBox.sizer.margin = 8;
   this.files_GroupBox.sizer.spacing = 8;
   this.files_GroupBox.sizer.add( this.files_TreeBox, 100 );
   this.files_GroupBox.sizer.add( this.filesButtons_Sizer );

   //

   this.targetIsActiveImage_CheckBox = new CheckBox( this );
   this.targetIsActiveImage_CheckBox.text = "Target is active image";
   this.targetIsActiveImage_CheckBox.toolTip =
         "<p>You can apply the script to the current active image "
       + "or to the specified list of input images.</p>";
   this.targetIsActiveImage_CheckBox.onClick = function( checked )
   {
      this.dialog.parameters.targetIsActiveImage = checked;
      this.dialog.updateControls();
   };

   this.targetIsActiveImage_Sizer = new HorizontalSizer;
   this.targetIsActiveImage_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.targetIsActiveImage_Sizer.add( this.targetIsActiveImage_CheckBox );
   this.targetIsActiveImage_Sizer.addStretch();

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

   let toolTipOutputDir =
         "<p>The directory where output files will be generated. "
       + "If this field is left blank, output files will be written on the "
       + "same directories as their corresponding input files.</p>";

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

   this.correctColumns_CheckBox = new CheckBox( this );
   this.correctColumns_CheckBox.text = "Correct columns";
   this.correctColumns_CheckBox.toolTip =
         "<p>Select this option if you want to correct a column pattern. "
       + "Leave this option unchecked to correct a row pattern.</p>";
   this.correctColumns_CheckBox.onClick = function( checked )
   {
      this.dialog.parameters.correctColumns = checked;
   };

   this.correctColumns_Sizer = new HorizontalSizer;
   this.correctColumns_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.correctColumns_Sizer.add( this.correctColumns_CheckBox );
   this.correctColumns_Sizer.addStretch();

   //

   this.correctEntireImage_CheckBox = new CheckBox( this );
   this.correctEntireImage_CheckBox.text = "Correct the entire image";
   this.correctEntireImage_CheckBox.toolTip =
         "<p>Select this option to correct all the columns or rows in the "
       + "images, or unckeck it to correct only specific columns or rows. If "
       + "you disable this option, you'll need to specify a defect list file "
       + "in the <em>Partial defects file</em> field.</p>";
   this.correctEntireImage_CheckBox.onClick = function( checked )
   {
      this.dialog.parameters.correctEntireImage = checked;
   };

   this.correctEntireImage_Sizer = new HorizontalSizer;
   this.correctEntireImage_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.correctEntireImage_Sizer.add( this.correctEntireImage_CheckBox );
   this.correctEntireImage_Sizer.addStretch();

   //

   let toolTipDefectTableFilePath =
         "<p>This file specifies the entire or partial rows or columns to be "
       + "corrected. It can be created whether with the LinearDefectDetection "
       + "script or with the CosmeticCorrection tool. By disabling the "
       + "<em>Correct entire image</em> option and specifying a file path here "
       + "you'll only correct these specific columns or rows. Alternatively, "
       + "you can check the <em>Correct entire image</em> option and, at the "
       + "same time, specify a defects file. This can be useful to correct "
       + "entire columns or rows in the image, correcting also partial columns "
       + "or rows in the same script execution.</p>";

   this.defectTableFilePath_Label = new Label( this );
   this.defectTableFilePath_Label.text = "Defects file:";
   this.defectTableFilePath_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.defectTableFilePath_Label.minWidth = labelWidth1;
   this.defectTableFilePath_Label.toolTip = toolTipDefectTableFilePath;

   this.defectTableFilePath_Edit = new Edit( this );
   this.defectTableFilePath_Edit.toolTip = toolTipDefectTableFilePath;

   this.defectTableFilePath_Edit.onEditCompleted = function()
   {
      this.text = this.dialog.parameters.defectTableFilePath = File.windowsPathToUnix( this.text.trim() );
   };

   this.defectTableFilePath_Edit.onGetFocus = function()
   {
      this.text = this.text.trim();
   };

   this.defectTableFilePath_Edit.onLoseFocus = function()
   {
      this.text = this.text.trim();
   };

   this.defectTableFilePathClear_Button = new ToolButton( this );
   this.defectTableFilePathClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.defectTableFilePathClear_Button.setScaledFixedSize( 20, 20 );
   this.defectTableFilePathClear_Button.toolTip = "<p>Clear the defects file.</p>";
   this.defectTableFilePathClear_Button.onClick = function()
   {
      this.dialog.defectTableFilePath_Edit.clear();
      this.dialog.defectTableFilePath_Edit.onEditCompleted();
   };

   this.defectTableFilePathSelect_Button = new ToolButton( this );
   this.defectTableFilePathSelect_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.defectTableFilePathSelect_Button.setScaledFixedSize( 20, 20 );
   this.defectTableFilePathSelect_Button.toolTip = "<p>Select the defects file.</p>";
   this.defectTableFilePathSelect_Button.onClick = function()
   {
      let ofd = new OpenFileDialog;
      ofd.initialPath = this.dialog.parameters.defectTableFilePath;
      ofd.caption = "Select Defects File";
      if ( ofd.execute() )
         this.dialog.defectTableFilePath_Edit.text = this.dialog.parameters.defectTableFilePath = ofd.fileName;
   };

   this.defectTableFilePath_Sizer = new HorizontalSizer;
   this.defectTableFilePath_Sizer.add( this.defectTableFilePath_Label );
   this.defectTableFilePath_Sizer.addSpacing( 4 );
   this.defectTableFilePath_Sizer.add( this.defectTableFilePath_Edit, 100 );
   this.defectTableFilePath_Sizer.addSpacing( 4 );
   this.defectTableFilePath_Sizer.add( this.defectTableFilePathClear_Button );
   this.defectTableFilePath_Sizer.addSpacing( 2 );
   this.defectTableFilePath_Sizer.add( this.defectTableFilePathSelect_Button );

   //

   let toolTipPostfix =
         "<p>This is a postfix that will be appended to the file name of each "
       + "generated out file.</p>";

   this.postfix_Label = new Label( this );
   this.postfix_Label.text = "Postfix:";
   this.postfix_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.postfix_Label.minWidth = labelWidth1;
   this.postfix_Label.toolTip = toolTipPostfix;

   this.postfix_Edit = new Edit( this );
   this.postfix_Edit.toolTip = toolTipPostfix;
   this.postfix_Edit.setMinWidth( emWidth*16 );

   this.postfix_Edit.validPostfix = function()
   {
      let postfix = this.text.trim();
      if ( postfix.length == 0 )
         return POSTFIX;
      return postfix;
   };

   this.postfix_Edit.onEditCompleted = function()
   {
      this.text = this.dialog.parameters.postfix = this.validPostfix();
   };

   this.postfix_Edit.onGetFocus = function()
   {
      this.text = this.validPostfix();
   };

   this.postfix_Edit.onLoseFocus = function()
   {
      this.text = this.validPostfix();
   };

   this.postfix_Sizer = new HorizontalSizer;
   this.postfix_Sizer.add( this.postfix_Label );
   this.postfix_Sizer.addSpacing( 4 );
   this.postfix_Sizer.add( this.postfix_Edit );
   this.postfix_Sizer.addStretch();

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
   this.layersToRemove_SpinBox.setRange( 6, 15 );
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

   this.globalRejection_CheckBox = new CheckBox( this );
   this.globalRejection_CheckBox.text = "Global rejection";
   this.globalRejection_CheckBox.toolTip =
         "<p>Check this option to perform a pixel rejection in the small-scale "
       + "image, based on the pixel values of the target image before applying "
       + "any processing. It works by measuring the background area noise and "
       + "setting a rejection limit in sigma units towards the higher pixel "
       + "values. In this way all pixels with higher values than the defined "
       + "limit will be rejected in the small-scale component image, preventing "
       + "them from altering the statistical properties of the lines. This is "
       + "useful to reject big areas of bright objects, like a galaxy or a "
       + "nebula. The rejected pixel values are set to 1 in the small-scale "
       + "image, so they will be rejected when we calculate the statistics of "
       + "the line.</p>";
   this.globalRejection_CheckBox.onClick = function( checked )
   {
      this.dialog.parameters.globalRejection = checked;
   };

   this.globalRejection_Sizer = new HorizontalSizer;
   this.globalRejection_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.globalRejection_Sizer.add( this.globalRejection_CheckBox );
   this.globalRejection_Sizer.addStretch();

   //

   let toolTipGlobalRejectionLimit =
         "<p>This parameter works like <em>Rejection limit</em>, but applied "
       + "to the global rejection task.</p>";

   this.globalRejectionLimit_Label = new Label( this );
   this.globalRejectionLimit_Label.text = "Global rejection limit:";
   this.globalRejectionLimit_Label.toolTip = toolTipGlobalRejectionLimit;
   this.globalRejectionLimit_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.globalRejectionLimit_Label.setFixedWidth( labelWidth1 );

   this.globalRejectionLimit_SpinBox = new SpinBox( this );
   this.globalRejectionLimit_SpinBox.setRange( 0, 15 );
   this.globalRejectionLimit_SpinBox.setFixedWidth( editWidth2 );
   this.globalRejectionLimit_SpinBox.toolTip = toolTipGlobalRejectionLimit
   this.globalRejectionLimit_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.globalRejectionLimit = value;
   }

   this.globalRejectionLimit_Sizer = new HorizontalSizer;
   this.globalRejectionLimit_Sizer.spacing = 4;
   this.globalRejectionLimit_Sizer.add( this.globalRejectionLimit_Label );
   this.globalRejectionLimit_Sizer.add( this.globalRejectionLimit_SpinBox );
   this.globalRejectionLimit_Sizer.addStretch();

   //

   this.backgroundReference_Label = new Label( this );
   this.backgroundReference_Label.text = "Background reference region:";
   this.backgroundReference_Label.toolTip =
         "<p>The specified background reference area defines the contrast of "
       + "the line pattern in the darker areas of the image. The easiest way "
       + "to set these values is to create a preview and take note of its "
       + "coordinates with <em>Preview > Modify Preview</em>.</p>";
   this.backgroundReference_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.backgroundReference_Label.setFixedWidth( labelWidth1 );

   this.backgroundReferenceLeft_SpinBox = new SpinBox( this );
   this.backgroundReferenceLeft_SpinBox.setRange( 0, 65535 );
   this.backgroundReferenceLeft_SpinBox.setFixedWidth( editWidth2 );
   this.backgroundReferenceLeft_SpinBox.toolTip = "<p>Background reference region, left pixel coordinate.</p>";
   this.backgroundReferenceLeft_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.backgroundReferenceLeft = value;
   }

   this.backgroundReferenceTop_SpinBox = new SpinBox( this );
   this.backgroundReferenceTop_SpinBox.setRange( 0, 65535 );
   this.backgroundReferenceTop_SpinBox.setFixedWidth( editWidth2 );
   this.backgroundReferenceTop_SpinBox.toolTip = "<p>Background reference region, top pixel coordinate.</p>";
   this.backgroundReferenceTop_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.backgroundReferenceTop = value;
   }

   this.backgroundReferenceWidth_SpinBox = new SpinBox( this );
   this.backgroundReferenceWidth_SpinBox.setRange( 0, 65535 );
   this.backgroundReferenceWidth_SpinBox.setFixedWidth( editWidth2 );
   this.backgroundReferenceWidth_SpinBox.toolTip = "<p>Background reference region, width in pixels.</p>";
   this.backgroundReferenceWidth_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.backgroundReferenceWidth = value;
   }

   this.backgroundReferenceHeight_SpinBox = new SpinBox( this );
   this.backgroundReferenceHeight_SpinBox.setRange( 0, 65535 );
   this.backgroundReferenceHeight_SpinBox.setFixedWidth( editWidth2 );
   this.backgroundReferenceHeight_SpinBox.toolTip = "<p>Background reference region, height in pixels.</p>";
   this.backgroundReferenceHeight_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.parameters.backgroundReferenceHeight = value;
   }

   this.backgroundReference_Sizer = new HorizontalSizer;
   this.backgroundReference_Sizer.spacing = 4;
   this.backgroundReference_Sizer.add( this.backgroundReference_Label );
   this.backgroundReference_Sizer.add( this.backgroundReferenceLeft_SpinBox );
   this.backgroundReference_Sizer.add( this.backgroundReferenceTop_SpinBox );
   this.backgroundReference_Sizer.add( this.backgroundReferenceWidth_SpinBox );
   this.backgroundReference_Sizer.add( this.backgroundReferenceHeight_SpinBox );
   this.backgroundReference_Sizer.addStretch();

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
   this.sizer.add( this.files_GroupBox, 100 );
   this.sizer.add( this.targetIsActiveImage_Sizer );
   this.sizer.add( this.closeFormerWorkingImages_Sizer );
   this.sizer.add( this.outputDir_Sizer );
   this.sizer.add( this.correctColumns_Sizer );
   this.sizer.add( this.correctEntireImage_Sizer );
   this.sizer.add( this.defectTableFilePath_Sizer );
   this.sizer.add( this.postfix_Sizer );
   this.sizer.add( this.layersToRemove_Sizer );
   this.sizer.add( this.rejectionLimit_Sizer );
   this.sizer.add( this.globalRejection_Sizer );
   this.sizer.add( this.globalRejectionLimit_Sizer );
   this.sizer.add( this.backgroundReference_Sizer );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE;

   //

   this.updateControls = function()
   {
      for ( let i = 0; i < this.parameters.inputFiles.length; ++i )
      {
         let node = new TreeBoxNode( this.files_TreeBox );
         node.setText( 0, this.parameters.inputFiles[i] );
      }

      this.setVariableSize();
      this.setScaledMinWidth( 600 );

      if ( this.parameters.targetIsActiveImage )
      {
         this.files_GroupBox.visible = false;
         this.ensureLayoutUpdated();
         this.adjustToContents();
         this.setFixedSize();
      }
      else
      {
         this.files_GroupBox.visible = true;
         this.ensureLayoutUpdated();
         this.adjustToContents();
      }

      this.targetIsActiveImage_CheckBox.checked = this.parameters.targetIsActiveImage;
      this.closeFormerWorkingImages_CheckBox.checked = this.parameters.closeFormerWorkingImages;
      this.outputDir_Edit.text = this.parameters.outputDir;
      this.correctColumns_CheckBox.checked = this.parameters.correctColumns;
      this.correctEntireImage_CheckBox.checked = this.parameters.correctEntireImage;
      this.defectTableFilePath_Edit.text = this.parameters.defectTableFilePath;
      this.postfix_Edit.text = this.parameters.postfix;
      this.layersToRemove_SpinBox.value = this.parameters.layersToRemove;
      this.rejectionLimit_SpinBox.value = this.parameters.rejectionLimit;
      this.globalRejection_CheckBox.checked = this.parameters.globalRejection;
      this.globalRejectionLimit_SpinBox.value = this.parameters.globalRejectionLimit;
      this.backgroundReferenceLeft_SpinBox.value = this.parameters.backgroundReferenceLeft;
      this.backgroundReferenceTop_SpinBox.value = this.parameters.backgroundReferenceTop;
      this.backgroundReferenceWidth_SpinBox.value = this.parameters.backgroundReferenceWidth;
      this.backgroundReferenceHeight_SpinBox.value = this.parameters.backgroundReferenceHeight;
   };

   this.updateControls();
}

LPSDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF LinearPatternSubtractionGUI.jsh - Released 2019-12-23T12:01:37Z
