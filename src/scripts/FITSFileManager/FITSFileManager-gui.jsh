// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// FITSFileManager-gui.jsh - Released 2020-01-27T18:07:10Z
// ----------------------------------------------------------------------------
//
// This file is part of FITSFileManager script version 1.5
//
// The complete source code with test scripts is hosted at:
//    https://github.com/bitli/FitsFileManager
//
// Copyright (c) 2012-2020 Jean-Marc Lugrin.
// Copyright (c) 2003-2020 Pleiades Astrophoto S.L.
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

var CompletionDialog_doneContinue = 0;
var CompletionDialog_doneKeep = 1;
var CompletionDialog_doneRemove = 2;
var CompletionDialog_doneLeave = 3;

// These sizes show depend on the screen size and font used

var MainDialogMinWidth = 750;

// Tree box for file lists minimum sizes, do not set too large to avoid problem on small screens
// BEWARE do not set too large to avoid problem on small screens or Linux/Mac, the user can make it larger
// If too small, the text overwrite the buttons or labels below it
var TreeboxWindowMinWidth = 600;
var InputTreeboxMinHeight = 100;
var TransformTreeBoxMinHeight = 100;

// Fits keys window:
// To make sure something reasonable is visible,
// if too large this may be a problem in small screens
var FitsKeysDialogMinimumHeight = 300;
var FitsKeysDialogMinimumWidth = 400;
// Make default more reasonable
var FitsKeysDialogPreferedHeight = 600;
var FitsKeysDialogPreferedWidth = 700;

var MaxErrorsDisplayed = 15;

// ------------------------------------------------------------------------------------------------------------------------
// Section Group - support to switch between SectionBar and a group box
// (section bar seems to cause problems with resizing,
// so does group box, but apparently only on Mac or small screen)
// ------------------------------------------------------------------------------------------------------------------------

#include <pjsr/SectionBar.jsh>

function makeSectionGroup( parent, content, title, initialyCollapsed )
{
   let section = new SectionBar( parent );
   section.setTitle( title );
   section.setSection( content );
   if ( initialyCollapsed )
      content.hide();

   section.setCollapsedTitle = function( title ) // ???
   {
      return;
   };

   section.addSection = function( sizer, weight ) // ???
   {
      sizer.add( this );
      sizer.add( this.section, weight );
   };

   return section;
}

// ========================================================================================================================
// GUI Main Dialog
// ========================================================================================================================

function MainDialog( engine, guiParameters )
{
   this.__base__ = Dialog;
   this.__base__();
   this.engine = engine;
   this.guiParameters = guiParameters;

   var that = this;

   this.showFullPath = false;

   var labelWidth = this.font.width( "MMMMMMMMMMMMMM" );

   // -- FITSKeyword Dialog (opened as a child on request)
   this.fitsKeysDialog = new FITSKeysDialog( this, engine );

   // -- CompletionDialog Dialog (opened as a child on request, when the requested file operation is completed)
   this.completionDialog = new CompletionDialog( this, engine );

   //----------------------------------------------------------------------------------
   // -- HelpLabel
   //----------------------------------------------------------------------------------
   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = Text.H.HELP_LABEL;

   //----------------------------------------------------------------------------------
   //--  Input file list section
   //----------------------------------------------------------------------------------
   this.filesTreeBox = new TreeBox( this );
   this.filesTreeBox.rootDecoration = false;
   this.filesTreeBox.numberOfColumns = 1;
   this.filesTreeBox.multipleSelection = true;
   this.filesTreeBox.headerVisible = true;
   this.filesTreeBox.headerSorting = true;
   this.filesTreeBox.setHeaderText( 0, "Filename" );
   this.filesTreeBox.sort( 0, true );
   this.filesTreeBox.setScaledMinSize( TreeboxWindowMinWidth, InputTreeboxMinHeight );
   this.filesTreeBox.toolTip = Text.H.FILES_TREEBOX_TOOLTIP;

   // Assume that 'check' is the only operation that update the nodes,
   // this may not be true...
   this.filesTreeBox.onNodeUpdated = function( node, column )
   {
      // Invert CheckMark
#ifdef DEBUG_EVENTS
      debug( "filesTreeBox: onNodeUpdated(" + node + "," + column + ")" );
#endif
      // Check box was likely changed
      this.dialog.updateTotal();
      this.dialog.refreshTargetFiles();
      this.dialog.updateButtonState();
   };

   // -- Actions for input file list ---------------------------------------------------------------------------------------
   this.actionControl = new Control( this );
   this.actionControl.sizer = new HorizontalSizer;

   // All buttons are properties of the dialog for easier reference, but they are added to the
   // "row" Control

   // -- Open FITS keyword dialog
   this.keyButton = new ToolButton( this.actionControl );
   this.keyButton.icon = this.scaledResource( ":/icons/document-text.png" );
   this.keyButton.setScaledFixedSize( 24, 24 );
   this.keyButton.toolTip = Text.H.KEY_BUTTON_TOOLTIP;
   this.keyButton.onClick = function()
   {
      if ( this.dialog.engine.keywordsSet.size() )
      {
         this.dialog.fitsKeysDialog.execute();
         this.dialog.showOrHideFITSkey();
      }
   };

   // --  Add files
   this.filesAdd_Button = new ToolButton( this.actionControl );
   this.filesAdd_Button.icon = this.scaledResource( ":/image-container/add-item.png" );
   this.filesAdd_Button.setScaledFixedSize( 24, 24 );
   this.filesAdd_Button.toolTip = "Add file(s)";
   this.filesAdd_Button.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select FITS Files";
      ofd.filters = [
         [ "FITS Files", "*.fit", "*.fits", "*.fts" ]
      ];
      if ( ofd.execute() )
         this.dialog.addFilesAction( ofd.fileNames );
   };

   // -- Add Directory
   this.dirAdd_Button = new ToolButton( this.actionControl );
   this.dirAdd_Button.icon = this.scaledResource( ":/image-container/add-files.png" );
   this.dirAdd_Button.setScaledFixedSize( 24, 24 );
   this.dirAdd_Button.toolTip = Text.H.DIRADD_BUTTON_TOOLTIP;
   this.dirAdd_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      //gdd.initialPath = outputDirectory;
      gdd.caption = "Select Input Directory";
      if ( gdd.execute() )
      {
#ifdef DEBUG
         debug( "Start searching FITS file in SubFolders" );
#endif
         // TODO Make configurable
         var fileNames = searchDirectory( gdd.directory + "/*.fit", true )
            .concat( searchDirectory( gdd.directory + "/*.fits", true ) )
            .concat( searchDirectory( gdd.directory + "/*.fts", true ) );
#ifdef DEBUG
         debug( "Finish searching FITS file in SubFolders" );
#endif
         this.dialog.addFilesAction( fileNames );
      }
   };

   // -- Check selected files
   this.checkSelected_Button = new ToolButton( this.actionControl );
   this.checkSelected_Button.icon = this.scaledResource( ":/browser/expand.png" );
   this.checkSelected_Button.setScaledFixedSize( 24, 24 );
   this.checkSelected_Button.toolTip = Text.H.CHECK_SELECTED_BUTTON_TOOLTIP;
   this.checkSelected_Button.onClick = function()
   {
#ifdef DEBUG
      debug( "checkSelected_Button: onClick" );
#endif
      for ( let i = 0; i < this.dialog.filesTreeBox.selectedNodes.length; i++ )
         this.dialog.filesTreeBox.selectedNodes[ i ].checked = true;
      this.dialog.updateTotal();
      this.dialog.refreshTargetFiles();
      this.dialog.updateButtonState();
   };

   // -- uncheck selected files
   this.uncheckSelected_Button = new ToolButton( this.actionControl );
   this.uncheckSelected_Button.icon = this.scaledResource( ":/browser/collapse.png" );
   this.uncheckSelected_Button.setScaledFixedSize( 24, 24 );
   this.uncheckSelected_Button.toolTip = Text.H.CHECK_UNSELECTED_BUTTON_TOOLTIP;
   this.uncheckSelected_Button.onClick = function()
   {
#ifdef DEBUG
      debug( "uncheckSelected_Button: onClick" );
#endif
      for ( let i = 0; i < this.dialog.filesTreeBox.selectedNodes.length; i++ )
         this.dialog.filesTreeBox.selectedNodes[ i ].checked = false;
      this.dialog.updateTotal();
      this.dialog.refreshTargetFiles();
      this.dialog.updateButtonState();
   };

   // -- Remove selected files
   this.remove_files_Button = new ToolButton( this.actionControl );
   this.remove_files_Button.icon = this.scaledResource( ":/toolbar/file-close.png" );
   this.remove_files_Button.setScaledFixedSize( 24, 24 );
   this.remove_files_Button.toolTip = Text.H.REMOVE_FILES_BUTTON_TOOLTIP;
   this.remove_files_Button.onClick = function()
   {
#ifdef DEBUG
      debug( "remove_files_Button: onClick" );
#endif
      for ( let iTreeBox = this.dialog.filesTreeBox.numberOfChildren; --iTreeBox >= 0; )
         if ( this.dialog.filesTreeBox.child( iTreeBox ).selected )
         {
            //var nameInTreeBox = this.dialog.filesTreeBox.child(iTreeBox).text(0);
            var nameInTreeBox = this.dialog.filesTreeBox.child( iTreeBox ).fullFileName;

            this.dialog.engine.removeFiles( nameInTreeBox );
            this.dialog.filesTreeBox.remove( iTreeBox );
         }
      this.dialog.updateTotal();
      // Refresh the generated files
      this.dialog.refreshTargetFiles();
      this.dialog.updateButtonState();
   };

   // -- Remove all files
   this.remove_all_files_Button = new ToolButton( this.actionControl );
   this.remove_all_files_Button.icon = this.scaledResource( ":/toolbar/file-close-all.png" );
   this.remove_all_files_Button.setScaledFixedSize( 24, 24 );
   this.remove_all_files_Button.toolTip = Text.H.REMOVE_ALL_FILES_BUTTON_TOOLTIP;
   this.remove_all_files_Button.onClick = function()
   {
#ifdef DEBUG
      debug( "remove_all_files_Button: onClick" );
#endif
      if ( this.dialog.filesTreeBox.numberOfChildren > 0 )
         if ( (new MessageBox( "Do you really want to remove all " +
                  this.dialog.filesTreeBox.numberOfChildren + " files from input list ?",
                  TITLE, StdIcon_Question, StdButton_No, StdButton_Yes )).execute() != StdButton_Yes )
         {
            return;
         }

      // TODO We can probably clear in one go
      for ( let i = this.dialog.filesTreeBox.numberOfChildren; --i >= 0; )
         this.dialog.filesTreeBox.remove( i );
      this.dialog.engine.reset();
      this.dialog.updateTotal();
      // Refresh the generated files
      this.dialog.refreshTargetFiles();
      this.dialog.updateButtonState();
   };

   this.fullPath_CheckBox = new CheckBox( this.actionControl );
   this.fullPath_CheckBox.text = "Full path";
   this.fullPath_CheckBox.state = this.showFullPath ? 1 : 0;
   this.fullPath_CheckBox.onCheck = function( checked )
   {
      this.dialog.showFullPath = checked;
      this.dialog.rebuildFilesTreeBox();
   };

   // -- Total file Label ---------------------------------------------------------------------------
   this.inputSummaryLabel = new Label( this.actionControl );
   this.inputSummaryLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   // -- Sizer for Input Files Section

   this.actionControl.sizer.margin = 6;
   this.actionControl.sizer.spacing = 4;
   this.actionControl.sizer.add( this.keyButton );
   this.actionControl.sizer.addSpacing( 6 );
   this.actionControl.sizer.add( this.filesAdd_Button );
   this.actionControl.sizer.add( this.dirAdd_Button );
   this.actionControl.sizer.add( this.checkSelected_Button );
   this.actionControl.sizer.add( this.uncheckSelected_Button );
   this.actionControl.sizer.addSpacing( 6 );
   this.actionControl.sizer.add( this.remove_files_Button );
   this.actionControl.sizer.add( this.remove_all_files_Button );
   this.actionControl.sizer.addSpacing( 12 );
   this.actionControl.sizer.add( this.fullPath_CheckBox );
   this.actionControl.sizer.addSpacing( 12 );
   this.actionControl.sizer.add( this.inputSummaryLabel );
   this.actionControl.sizer.addStretch();

   this.inputFiles_Control = new Control( this );
   this.inputFiles_Control.sizer = new VerticalSizer;
   this.inputFiles_Control.sizer.margin = 4;
   this.inputFiles_Control.sizer.spacing = 2;
   this.inputFiles_Control.sizer.add( this.filesTreeBox, 100 );
   this.inputFiles_Control.sizer.add( this.actionControl );

   this.barInput = makeSectionGroup( this, this.inputFiles_Control, "Input", false );
   this.barInput.setCollapsedTitle( "Input - No file" );
   this.barInput.onToggleSection = function( bar, toggleBegin )
   {
      if ( !toggleBegin )
      {
         if ( this.section.visible || this.dialog.barResult.section.visible )
         {
            if ( this.dialog.__savedMinHeight != undefined )
            {
               this.dialog.setVariableHeight();
               this.dialog.minHeight = this.dialog.__savedMinHeight;
            }
         }
         else
         {
            this.dialog.__savedMinHeight = this.dialog.minHeight;
            this.dialog.setVariableHeight();
            this.dialog.setFixedHeight( this.dialog.smartMinHeight );
         }
      }
   };

   //----------------------------------------------------------------------------------
   // -- Configuration section
   //----------------------------------------------------------------------------------

   // This section shows current configuration and allow access to the configuration dialog

   var configurationSelectedCallback = function( configurationName )
   {
#ifdef DEBUG
      debug( "MainDialog: configurationSelectedCallback - ConfigurationSet selected:", configurationName );
#endif
      var selectedConfiguration = ffM_Configuration.getConfigurationByName( ffM_Configuration.getConfigurationTable(), configurationName );
      if ( selectedConfiguration == null )
         throw "PROGRAM ERROR - Invalid configuration set name '" + configurationName + "'";

      // Update the configuration - THIS REBUILD MOST OF THE VARIABLES AND FILE LISTS
      ffM_Configuration.setActiveConfigurationName( configurationName );
      that.configurationDescription_Label.text = ffM_Configuration.getActiveConfigurationElement().description;

      try
      {
         that.cursor = new Cursor( StdCursor_Hourglass );
         that.engine.setConfiguration( ffM_Configuration.createWorkingConfiguration() );
         that.engine.rebuildAll();

         // TODO - Merge with action on add files and manage configurations
         that.rebuildFilesTreeBox();
         that.updateTotal();
         that.refreshTargetFiles();
         that.updateButtonState();
      }
      finally
      {
         that.dialog.cursor = new Cursor( StdCursor_Arrow );
      }
   };

   this.configurationSelection_ComboBox = new ffM_GUI_config.ConfigurationSelection_ComboBox( this, [], configurationSelectedCallback );
   this.configurationSelection_ComboBox.configure(
      ffM_Configuration.getAllConfigurationNames( ffM_Configuration.getConfigurationTable() ),
      ffM_Configuration.getActiveConfigurationName() );

   this.configuration_Button = new PushButton( this );
   this.configuration_Button.text = Text.T.CONFIGURE_BUTTON_TEXT;
   this.configuration_Button.toolTip = Text.H.CONFIGURE_BUTTON_TOOLTIP;
   this.configuration_Button.enabled = true;
   this.configurationDialog = ffM_GUI_config.makeDialog( this, this.guiParameters );

   this.configurationDescription_Label = new Label();
   this.configurationDescription_Label.text = ffM_Configuration.getActiveConfigurationElement().description;
   this.configurationDescription_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.configurationDescription_Label.toolTip = "The description of the current configuration (define the synthetic variables)";

   this.configuration_Button.onClick = function()
   {
      var configurationName = ffM_Configuration.getActiveConfigurationName();
      var configurationDialog = this.dialog.configurationDialog;
      configurationDialog.configure( ffM_Configuration.getConfigurationTable(), configurationName );

      var result = configurationDialog.execute();

      if ( result )
      {
         // Update the configuration - THIS REBUILD MOST OF THE VARIABLES AND FILE LISTS
         ffM_Configuration.replaceConfigurationTable( configurationDialog.editedConfigurationSet, configurationDialog.selectedConfiguration.name )

         this.dialog.configurationSelection_ComboBox.configure(
            ffM_Configuration.getAllConfigurationNames( configurationDialog.editedConfigurationSet ),
            configurationDialog.selectedConfiguration.name );

         this.dialog.configurationDescription_Label.text = ffM_Configuration.getActiveConfigurationElement().description;

         try
         {
            this.dialog.cursor = new Cursor( StdCursor_Hourglass );
            engine.setConfiguration( ffM_Configuration.createWorkingConfiguration() );

            engine.rebuildAll();


            // TODO - Merge with action on add files and select configuration
            this.dialog.rebuildFilesTreeBox();
            this.dialog.updateTotal();
            this.dialog.refreshTargetFiles();
            this.dialog.updateButtonState();
         }
         finally
         {
            this.dialog.cursor = new Cursor( StdCursor_Arrow );
         }
      }
   };

   // Target template --------------------------------------------------------------------------------------

   this.targetFileTemplate_ComboBox = new ComboBox( this );
   this.targetFileTemplate_ComboBox.toolTip = Text.H.TARGET_FILE_TEMPLATE_TOOLTIP;
   this.targetFileTemplate_ComboBox.enabled = true;
   this.targetFileTemplate_ComboBox.editEnabled = true;
   for ( let it = 0; it < guiParameters.targetFileItemListText.length; it++ )
      this.targetFileTemplate_ComboBox.addItem( "\'" + guiParameters.targetFileItemListText[ it ] + "\' - " + guiParameters.targetFileItemListComment[ it ] );
   this.targetFileTemplate_ComboBox.editText = guiParameters.targetFileItemListText[ 0 ];

   this.targetFileTemplate_ComboBox.onEditTextUpdated = function()
   {
#ifdef DEBUG
      debug( "targetFileTemplate_ComboBox: onEditTextUpdated " + this.editText );
#endif
      var text = this.editText;
      var templateErrors = [];

      var templateErrors = [];
      var t = ffM_template.analyzeTemplate( templateErrors, text );
      if ( templateErrors.length === 0 )
      {
         this.textColor = 0x000000;
         guiParameters.targetFileNameCompiledTemplate = t;
         this.dialog.refreshTargetFiles();
         this.dialog.updateButtonState();
      }
      else
         this.textColor = 0xFF0000;
   };

   this.targetFileTemplate_ComboBox.onItemSelected = function()
   {
#ifdef DEBUG
      debug( "targetFileTemplate_ComboBox: onItemSelected " + this.currentItem );
#endif
      if ( this.currentItem >= guiParameters.targetFileItemListText.length )
         return; // protect us when a 'CR' is typed in the field, currentItem may be outside of array

      var text = guiParameters.targetFileItemListText[ this.currentItem ];
      this.dialog.targetFileTemplate_ComboBox.editText = text;
      var templateErrors = [];
      var t = ffM_template.analyzeTemplate( templateErrors, text );
      if ( templateErrors.length === 0 )
      {
         this.textColor = 0x000000;
         guiParameters.targetFileNameCompiledTemplate = t;
         this.dialog.refreshTargetFiles();
         this.dialog.updateButtonState();
      }
      else
         this.textColor = 0xFF0000;
   };

   // Regular expression on source file --------------------------------------------------------------------------------------
   this.regexp_ComboBox = new ComboBox( this );
   this.regexp_ComboBox.toolTip = Text.H.SOURCE_FILENAME_REGEXP_TOOLTIP;
   this.regexp_ComboBox.enabled = true;
   this.regexp_ComboBox.editEnabled = true;
   for ( let it = 0; it < guiParameters.regexpItemListText.length; it++ )
      this.regexp_ComboBox.addItem( "'" + guiParameters.regexpItemListText[ it ] + "' - " + guiParameters.regexpItemListComment[ it ] );
   this.regexp_ComboBox.editText = guiParameters.regexpItemListText[ 0 ];

   this.regexp_ComboBox.onEditTextUpdated = function()
   {
#ifdef DEBUG
      debug( "regexp_ComboBox: onEditTextUpdated " + this.editText );
#endif
      for ( let it = 0; it < guiParameters.regexpItemListText.length; it++ )
         if ( this.editText === ( "\'" + guiParameters.regexpItemListText[ it ] + "\' - " + guiParameters.regexpItemListComment[ it ] ) )
         {
#ifdef DEBUG
            debug( "regexp_ComboBox: onEditTextUpdated - skip onEditTextUpdated, likely an onItemSelected" );
#endif
            return;
         }

      var re = this.editText.trim();
      var needRefresh = false;
      if ( re.length === 0 )
      {
         if ( guiParameters.sourceFileNameRegExp !== null )
            needRefresh = true;
         guiParameters.sourceFileNameRegExp = null;
#ifdef DEBUG
         debug( "sourceTemplate_Edit: onTextUpdated:- cancel regexp" );
#endif
      }
      else
      {
         try
         {
            var regExpAsString = regExpFromUserString( re );
            if ( guiParameters.sourceFileNameRegExp !== regExpAsString )
            {
               needRefresh = true;
            }
            guiParameters.sourceFileNameRegExp = regExpAsString;
            this.textColor = 0x000000;
#ifdef DEBUG
            debug( "sourceTemplate_Edit: onTextUpdated: regexp: " + guiParameters.sourceFileNameRegExp );
#endif
         }
         catch ( err )
         {
            // Do not refresh in case of error in regexp, wait until corrected
            guiParameters.sourceFileNameRegExp = null;
            this.textColor = 0xFF0000;
#ifdef DEBUG
            debug( "sourceTemplate_Edit: onTextUpdated:  bad regexp - err: " + err );
#endif
         }
      }
      if ( needRefresh )
      {
         this.dialog.refreshTargetFiles();
         this.dialog.updateButtonState();
      }
   };

   this.regexp_ComboBox.onItemSelected = function()
   {
#ifdef DEBUG
      debug( "regexp_ComboBox: onItemSelected " + this.currentItem );
#endif
      if ( this.currentItem >= guiParameters.regexpItemListText.length )
         return; // protect as when a 'CR' is typed in the field, currentItem may be outside of array

      var text = guiParameters.regexpItemListText[ this.currentItem ];
      this.dialog.regexp_ComboBox.editText = text;
      var re = text.trim();
      if ( re.length === 0 )
      {
         guiParameters.sourceFileNameRegExp = null;
#ifdef DEBUG
         debug( "sourceTemplate_Edit: onTextUpdated:- cancel regexp" );
#endif
      }
      else
      {
         try
         {
            guiParameters.sourceFileNameRegExp = regExpFromUserString( re );
            this.textColor = 0x000000;
#ifdef DEBUG
            debug( "sourceTemplate_Edit: onTextUpdated: regexp: " + guiParameters.sourceFileNameRegExp );
#endif
            this.dialog.refreshTargetFiles();
            this.dialog.updateButtonState();

         }
         catch ( err )
         {
            guiParameters.sourceFileNameRegExp = null;
            this.textColor = 0xFF0000;
#ifdef DEBUG
            debug( "sourceTemplate_Edit: onTextUpdated:  bad regexp - err: " + err );
#endif
         }
      }
   };

   // Group template --------------------------------------------------------------------------------------

   this.groupTemplate_ComboBox = new ComboBox( this );
   this.groupTemplate_ComboBox.toolTip = Text.H.GROUP_TEMPLATE_TOOLTIP;
   this.groupTemplate_ComboBox.enabled = true;
   this.groupTemplate_ComboBox.editEnabled = true;
   for ( let it = 0; it < guiParameters.groupItemListText.length; it++ )
      this.groupTemplate_ComboBox.addItem( "\'" + guiParameters.groupItemListText[ it ] + "\' - " + guiParameters.groupItemListComment[ it ] );
   this.groupTemplate_ComboBox.editText = guiParameters.groupItemListText[ 0 ];

   this.groupTemplate_ComboBox.onEditTextUpdated = function()
   {
#ifdef DEBUG
      debug( "groupTemplate_ComboBox: onEditTextUpdated " + this.editText );
#endif
      var text = this.editText;
      var templateErrors = [];

      var t = ffM_template.analyzeTemplate( templateErrors, text );
      if ( templateErrors.length === 0 )
      {
         this.textColor = 0x000000;
         guiParameters.groupByCompiledTemplate = t;
         this.dialog.refreshTargetFiles();
      }
      else
         this.textColor = 0xFF0000;
   };

   this.groupTemplate_ComboBox.onItemSelected = function()
   {
#ifdef DEBUG
      debug( "groupTemplate_ComboBox: onItemSelected " + this.currentItem );
#endif
      if ( this.currentItem >= guiParameters.groupItemListText.length )
         return; // protect as when a 'CR' is typed in the field, currentItem may be outside of array

      var text = guiParameters.groupItemListText[ this.currentItem ];
      this.dialog.groupTemplate_ComboBox.editText = text;
      var templateErrors = [];
      var t = ffM_template.analyzeTemplate( templateErrors, text );
      if ( templateErrors.length === 0 )
      {
         this.textColor = 0x000000;
         guiParameters.groupByCompiledTemplate = t;
         this.dialog.refreshTargetFiles();
      }
      else
         this.textColor = 0xFF0000;
   };

   // Sizers

   var configurationNameMinWidth = this.font.width( "Target file template: " );

   this.configurationSelection_sizer = new HorizontalSizer;
   this.configurationSelection_sizer.margin = 4;
   this.configurationSelection_sizer.spacing = 2;
   this.configurationLabel = new Label();
   this.configurationLabel.setFixedWidth( labelWidth );
   this.configurationLabel.text = "Configuration: ";
   this.configurationLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.configurationSelection_sizer.add( this.configurationLabel );
   this.configurationSelection_sizer.add( this.configurationSelection_ComboBox );
   this.configurationSelection_sizer.addSpacing( 5 );
   this.configurationSelection_ComboBox.minWidth = configurationNameMinWidth;

   this.configurationSelection_sizer.add( this.configurationDescription_Label );
   this.configurationSelection_sizer.addStretch();
   this.configurationSelection_sizer.add( this.configuration_Button );

   this.targetFileTemplate_Edit_sizer = new HorizontalSizer;
   this.targetFileTemplate_Edit_sizer.margin = 4;
   this.targetFileTemplate_Edit_sizer.spacing = 2;
   this.targetFileTemplateLabel = new Label();
   this.targetFileTemplateLabel.setFixedWidth( labelWidth );
   this.targetFileTemplateLabel.text = "Target file template: ";
   this.targetFileTemplateLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.targetFileTemplate_Edit_sizer.add( this.targetFileTemplateLabel );
   this.targetFileTemplate_Edit_sizer.add( this.targetFileTemplate_ComboBox, 100 );

   this.regexp_ComboBox_sizer = new HorizontalSizer;
   this.regexp_ComboBox_sizer.margin = 4;
   this.regexp_ComboBox_sizer.spacing = 2;
   this.regExpLabel = new Label();
   this.regExpLabel.setFixedWidth( labelWidth );;
   this.regExpLabel.text = "File name RegExp: ";
   this.regExpLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.regexp_ComboBox_sizer.add( this.regExpLabel );
   this.regexp_ComboBox_sizer.add( this.regexp_ComboBox, 100 );

   this.groupTemplate_ComboBox_sizer = new HorizontalSizer;
   this.groupTemplate_ComboBox_sizer.margin = 4;
   this.groupTemplate_ComboBox_sizer.spacing = 2;
   this.groupTemplateLabel = new Label();
   this.groupTemplateLabel.setFixedWidth( labelWidth );
   this.groupTemplateLabel.text = "Group template: ";
   this.groupTemplateLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.groupTemplate_ComboBox_sizer.add( this.groupTemplateLabel );
   this.groupTemplate_ComboBox_sizer.add( this.groupTemplate_ComboBox, 100 );

   this.rules_Control = new Control( this );
   this.rules_Control.sizer = new VerticalSizer;
   this.rules_Control.sizer.margin = 4;
   this.rules_Control.sizer.spacing = 2;
   this.rules_Control.sizer.add( this.configurationSelection_sizer );
   this.rules_Control.sizer.add( this.targetFileTemplate_Edit_sizer, 100 );
   this.rules_Control.sizer.add( this.regexp_ComboBox_sizer );
   this.rules_Control.sizer.add( this.groupTemplate_ComboBox_sizer );

   this.barRules = makeSectionGroup( this, this.rules_Control, "Renaming rules", false );

#ifdef FITSKEYS

   //----------------------------------------------------------------------------------
   // -- FITS keyword operations section
   //----------------------------------------------------------------------------------

   this.fits_Control = new Control( this );

   this.fits_Control.sizer = new VerticalSizer;
   this.fits_Control.sizer.margin = 4;
   this.fits_Control.sizer.spacing = 2;

   /*  this.fits_Control.sizer.add( this.configurationSelection_sizer );
   this.fits_Control.sizer.add( this.targetFileTemplate_Edit_sizer, 100);
   this.fits_Control.sizer.add( this.regexp_ComboBox_sizer );
   this.fits_Control.sizer.add( this.groupTemplate_ComboBox_sizer );
   */

   this.fits_TreeBox = new TreeBox( this );
   this.fits_Control.sizer.add( this.fits_TreeBox );

   this.fits_TreeBox.rootDecoration = false;
   this.fits_TreeBox.numberOfColumns = 4;
   this.fits_TreeBox.multipleSelection = false;
   this.fits_TreeBox.headerVisible = true;
   this.fits_TreeBox.headerSorting = false;

   //this.fits_TreeBox.sort(0,sorted); // DO NOT SEEMS TO WORK

   this.fits_TreeBox.style = Frame.FrameStyleSunken;

   this.fits_TreeBox.toolTip = "TBD";

   this.fits_TreeBox.setHeaderText( 0, "operation" );
   this.fits_TreeBox.setHeaderText( 1, "keyword" );
   this.fits_TreeBox.setHeaderText( 2, "type" );
   this.fits_TreeBox.setHeaderText( 3, "value" );
   this.fits_TreeBox.setHeaderText( 4, "comment" );

   this.fits_TreeBox.setColumnWidth( 0, 50 );
   this.fits_TreeBox.setColumnWidth( 1, 150 );
   this.fits_TreeBox.setColumnWidth( 2, 50 );
   this.fits_TreeBox.setColumnWidth( 3, 300 );
   this.fits_TreeBox.setColumnWidth( 3, 600 );

   var listModel = new Array;
   var elementFactory = function elementFactory()
   {
      return "";
   };
   // Create a node based on the model described in modelDescription
   var makeNode = function( treeBox, nodeModel, index )
   {
      //Log.debug('ManagedList_Box: makeNode -',Log.pp(nodeModel),Log.pp(modelDescription));
      var node = new TreeBoxNode( treeBox, index );
      /*for (var i=0; i<modelDescription.length;i++){
         node.setText(i, nodeModel[modelDescription[i].propertyName].toString());
      }*/
      /*  var operation_ComboBox = new ComboBox( this );
      operation_ComboBox.toolTip = "Operation of FITS keyword";
      operation_ComboBox.addItem( "One" , new Bitmap( ":/images/icons/select.png" ));
      operation_ComboBox.addItem( "Two", new Bitmap( ":/images/icons/ok.png" ) );
      operation_ComboBox.addItem( "Three", new Bitmap( ":/images/icons/cancel.png" ) );
*/
      //node.setXXX(o,
      for ( let i = 0; i < 4; i++ )
         node.setText( i, i.toString() );
      return node;
   };

   // The list model is changed (the model is an array that is updated in place)
   this.modelListChanged = function( newModelList )
   {
      // Clear current list display
      var nmbNodes = this.fits_TreeBox.numberOfChildren;
      for ( let i = nmbNodes; i > 0; i-- )
         this.fits_TreeBox.remove( i - 1 );
      // Update variable tracking current model
      listModel = newModelList;

      // Add new nodes
      for ( let i = 0; i < listModel.length; i++ )
      {
         // Just making the nodes adds them to the fits_TreeBox
         makeNode( this.fits_TreeBox, listModel[ i ], i );
      }
   };
   // Create initial model
   this.modelListChanged( new Array ); //initialListModel);

   // -- Internal actions
   var upAction = function()
   {
      var nodeToMove, nodeIndex, element1, element2;
      if ( that.fits_TreeBox.selectedNodes.length > 0 )
      {
         nodeToMove = that.fits_TreeBox.selectedNodes[ 0 ];
         nodeIndex = that.fits_TreeBox.childIndex( nodeToMove );
         if ( nodeIndex > 0 )
         {
            // Update model
            element1 = listModel[ nodeIndex - 1 ];
            element2 = listModel[ nodeIndex ];
            listModel.splice( nodeIndex - 1, 2, element2, element1 );
            // update UI
            that.fits_TreeBox.remove( nodeIndex );
            that.fits_TreeBox.insert( nodeIndex - 1, nodeToMove );
            that.fits_TreeBox.currentNode = nodeToMove;
         }
      }
   };
   var downAction = function()
   {
      var nodeToMove, nodeIndex, element1, element2;
      if ( that.fits_TreeBox.selectedNodes.length > 0 )
      {
         nodeToMove = that.fits_TreeBox.selectedNodes[ 0 ];
         nodeIndex = that.fits_TreeBox.childIndex( nodeToMove );
         if ( nodeIndex < that.fits_TreeBox.numberOfChildren - 1 )
         {
            // Update model
            element1 = listModel[ nodeIndex ];
            element2 = listModel[ nodeIndex + 1 ];
            listModel.splice( nodeIndex, 2, element2, element1 );
            // update UI
            that.fits_TreeBox.remove( nodeIndex );
            that.fits_TreeBox.insert( nodeIndex + 1, nodeToMove );
            that.fits_TreeBox.currentNode = nodeToMove;
         }
      }
   };
   var addAction = function()
   {
      var nodeBeforeNew, newNode;
      var nodeIndex = that.fits_TreeBox.numberOfChildren;
      if ( that.fits_TreeBox.selectedNodes.length > 0 )
      {
         nodeBeforeNew = that.fits_TreeBox.selectedNodes[ 0 ];
         nodeIndex = that.fits_TreeBox.childIndex( nodeBeforeNew ) + 1;
      }
      // Create node
      var element = elementFactory();
      if ( element !== null )
      {
         // insert node in model then ui
         listModel.splice( nodeIndex, 0, element );
         newNode = makeNode( that.fits_TreeBox, element, nodeIndex );
         that.fits_TreeBox.currentNode = newNode;
         that.fits_TreeBox.onNodeSelectionUpdated();
      }
   };

   var deleteAction = function()
   {
      var nodeToDelete, nodeIndex;
      if ( that.fits_TreeBox.selectedNodes.length > 0 )
      {
         nodeToDelete = that.fits_TreeBox.selectedNodes[ 0 ];
         nodeIndex = that.fits_TreeBox.childIndex( nodeToDelete );
         listModel.splice( nodeIndex, 1 );
         that.fits_TreeBox.remove( nodeIndex );
      }
   };

   var buttons = [
   {
      icon: ":/browser/move-up.png",
      toolTip: "Move item up",
      action: upAction
   },
   {
      icon: ":/browser/move-down.png",
      toolTip: "Move item down",
      action: downAction
   },
   {
      icon: ":/icons/add.png",
      toolTip: "Add new item",
      action: addAction
   },
   {
      icon: ":/icons/remove.png",
      toolTip: "Delete item",
      action: deleteAction
   }, ];

   var iconButtonBar = new ffM_GUI_support.IconButtonBar( this, buttons );
   this.fits_Control.sizer.add( iconButtonBar );

   this.barFITS = makeSectionGroup( this, this.fits_Control, "FITS keywords operations", false );

#endif // #ifdef FITSKEYS

   //----------------------------------------------------------------------------------
   // -- Output directory section
   //----------------------------------------------------------------------------------

   //Output Dir --------------------------------------------------------------------------------------
   this.outputDir_Edit = new Edit( this );
   this.outputDir_Edit.readOnly = true;
   this.outputDir_Edit.text = this.engine.outputDirectory;
   this.outputDir_Edit.toolTip = Text.H.OUTPUTDIR_TOOLTIP;

   this.outputDirSelect_Button = new ToolButton( this );
   this.outputDirSelect_Button.icon = this.scaledResource( ":/browser/select-file.png" );
   this.outputDirSelect_Button.setScaledFixedSize( 24, 24 );
   this.outputDirSelect_Button.toolTip = Text.H.OUTPUTDIR_SELECT_TOOLTIP;
   this.outputDirSelect_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.initialPath = engine.outputDirectory;
      gdd.caption = Text.T.GET_DIRECTORY_DIALOG_CAPTION;
      if ( gdd.execute() )
      {
         this.dialog.engine.outputDirectory = gdd.directory;
         this.dialog.outputDir_Edit.text = this.dialog.engine.outputDirectory;
         this.dialog.barOutput.setCollapsedTitle( Text.T.OUPUT_SECTION_TEXT_PART + " - " + this.dialog.engine.outputDirectory );
         this.dialog.updateButtonState();
      }
   };

   this.outputDir_Control = new Control( this );
   this.outputDir_Control.sizer = new HorizontalSizer;
   this.outputDir_Control.sizer.margin = 4;
   this.outputDir_Control.sizer.spacing = 2;
   this.outputDir_Control.sizer.add( this.outputDir_Edit, 100 );
   this.outputDir_Control.sizer.add( this.outputDirSelect_Button );

   this.barOutput = makeSectionGroup( this, this.outputDir_Control, Text.T.OUPUT_SECTION_TEXT_PART, false );

   //----------------------------------------------------------------------------------
   // -- Operation list and action section
   //----------------------------------------------------------------------------------

   this.showCheckErrors = function( errors )
   {
      let errorText;
      // Limit number of lines
      if ( errors.length > MaxErrorsDisplayed )
         errorText = errors.slice( 0, MaxErrorsDisplayed - 1 ).join( "\n" ) + "\n and " + ( errors.length - MaxErrorsDisplayed ) + " other errors...";
      else
         errorText = errors.join( "\n" );

      (new MessageBox( errorText, "Check failed", StdIcon_Error, StdButton_Ok )).execute();
   };

   // Result operations --------------------------------------------------------------------------------------
   this.transform_TreeBox = new TreeBox( this );

   this.transform_TreeBox.rootDecoration = false;
   this.transform_TreeBox.numberOfColumns = 1;
   this.transform_TreeBox.multipleSelection = false;
   this.transform_TreeBox.headerVisible = false;
   this.transform_TreeBox.headerSorting = false;
   this.transform_TreeBox.setHeaderText( 0, "Filename" );
   //this.transform_TreeBox.sort(0,false);
   this.transform_TreeBox.setScaledMinSize( TreeboxWindowMinWidth, TransformTreeBoxMinHeight );
   this.transform_TreeBox.toolTip = Text.H.TRANSFORM_TREEBOX_TOOLTIP;

   // Select the corresponding source file when the target file is selected
   // Note that the source files may not all be in the list, so
   // a lookup is required.
   // This events occurs when the user clicked on a resulting operation line
   this.transform_TreeBox.onCurrentNodeUpdated = function( newCurrentNode )
   {
      // First make sure that order is still valid, otherwise we would select the wrong file.
      if ( !this.dialog.checkInputFileIndices() )
      {
         this.dialog.showCheckErrors( [ "The order of some column changed since last refresh, please refresh" ] );
         return;
      }
      // Find corresponding node in input list
      if ( newCurrentNode !== null )
      {
         // The index in the input file was calculated when the file was added to the transformation list
         let index = newCurrentNode.inputFileIndex;
         this.dialog.filesTreeBox.currentNode = this.dialog.filesTreeBox.child( index );
      }
   };

   this.outputSummaryControl = new Control( this );
   this.outputSummaryControl.sizer = new HorizontalSizer;
   this.outputSummaryControl.sizer.margin = 4;

   // Keep label owned by dialog for easy reference, put in control in an attempt to solve diffirences of behavior on Unix
   this.outputSummaryLabel = new Label( this.outputSummaryControl );
   this.outputSummaryLabel.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.outputSummaryLabel.text = "No operation";
   this.outputSummaryControl.sizer.addSpacing( 4 );
   this.outputSummaryControl.sizer.add( this.outputSummaryLabel );
   this.outputSummaryControl.sizer.addStretch();

   this.outputFiles_Control = new Control( this );
   this.outputFiles_Control.sizer = new VerticalSizer;
   this.outputFiles_Control.sizer.margin = 4;
   this.outputFiles_Control.sizer.spacing = 2;
   this.outputFiles_Control.sizer.add( this.transform_TreeBox, 100 );
   this.outputFiles_Control.sizer.add( this.outputSummaryControl );

   this.barResult = makeSectionGroup( this, this.outputFiles_Control, Text.T.RESULT_SECTION_PART_TEXT, false );
   this.barResult.setCollapsedTitle( Text.T.RESULT_SECTION_PART_TEXT + " - None" );
   this.barResult.onToggleSection = function( bar, toggleBegin )
   {
      if ( !toggleBegin )
      {
         if ( this.section.visible || this.dialog.barInput.section.visible )
         {
            if ( this.dialog.__savedMinHeight != undefined )
            {
               this.dialog.setVariableHeight();
               this.dialog.minHeight = this.dialog.__savedMinHeight;
            }
         }
         else
         {
            this.dialog.__savedMinHeight = this.dialog.minHeight;
            this.dialog.setVariableHeight();
            this.dialog.setFixedHeight( this.dialog.smartMinHeight );
         }
      }
   };

   // -- Action buttons --------------------------------------------------------------------------------------

   this.check_Button = new PushButton( this );
   this.check_Button.text = Text.T.CHECK_BUTTON_TEXT;
   this.check_Button.toolTip = Text.H.CHECK_BUTTON_TOOLTIP;
   this.check_Button.enabled = true;
   this.check_Button.onClick = function()
   {
      // TODO Refactor with other actions
      if ( !this.parent.checkInputFileIndices() )
      {
         this.dialog.showCheckErrors( [ "The order of some column changed since last refresh, please refresh" ] );
         return;
      }

      var listOfFiles = this.parent.makeListOfCheckedFiles();
      var errors = this.parent.engine.checkValidTargets( listOfFiles );
      if ( errors.length > 0 )
      {
         this.dialog.showCheckErrors( errors );
      }
      else if ( this.parent.engine.targetFiles.length === 0 )
      {
         (new MessageBox( "There is no file to move or copy",
                          "Check irrelevant", StdIcon_Information, StdButton_Ok )).execute();
      }
      else
      {
         var text = "" + this.parent.engine.targetFiles.length + " files checked";
         if ( this.parent.engine.nmbFilesTransformed > 0 )
         {
            if ( this.parent.engine.someFilesAreConverted )
               text += ", " + this.parent.engine.nmbFilesTransformed + " to load/save (for conversion)";
            else
               text += ", " + this.parent.engine.nmbFilesTransformed + " to copy, move or load/save";
         }

         //      this.engine.nmbFilesSkipped;
         if ( this.parent.engine.nmbFilesInError > 0 ) // Should not happen
            text += ", " + this.parent.engine.nmbFilesInError + " IN ERROR";

         if ( !this.parent.engine.outputDirectory )
            text += ",\nbut output directory is not defined";

         (new MessageBox( text, "Check successful", StdIcon_Information, StdButton_Ok )).execute();
      }
   };

   this.refresh_Button = new PushButton( this );
   this.refresh_Button.text = Text.T.REFRESH_BUTTON_TEXT;
   this.refresh_Button.toolTip = Text.H.REFRESH_BUTTON_TOOLTIP;
   this.refresh_Button.enabled = true;
   this.refresh_Button.onClick = function()
   {
      this.parent.removeDeletedFiles();
      this.parent.refreshTargetFiles();
      this.dialog.updateButtonState();
   };

   this.move_Button = new PushButton( this );
   this.move_Button.text = Text.T.MOVE_BUTTON_TEXT;
   this.move_Button.toolTip = Text.H.MOVE_BUTTON_TOOLTIP;
   this.move_Button.enabled = false;
   this.move_Button.onClick = function()
   {
      // TODO Refactor with other actions
      if ( !this.parent.checkInputFileIndices() )
      {
         this.dialog.showCheckErrors( [ "The order of some column changed since last refresh, please refresh" ] );
         return;
      }
      var listOfFiles = this.parent.makeListOfCheckedFiles();
      var errors = this.parent.engine.checkValidTargets( listOfFiles );
      if ( errors.length > 0 )
      {
         this.dialog.showCheckErrors( errors );
         return;
      }
      try
      {
         console.show();
         this.dialog.cursor = new Cursor( StdCursor_Hourglass );
         var resultText = this.parent.engine.executeFileOperations( 0 );
         this.parent.removeDeletedFiles();
         this.parent.refreshTargetFiles();
         this.parent.updateButtonState();
      }
      finally
      {
         this.dialog.cursor = new Cursor( StdCursor_Arrow );
         //console.hide();
      }
      this.dialog.completionDialog.setResultText( resultText + "\nMoved files were removed from the input list" );
      this.dialog.completionDialog.setResultModeMove();
      var completionCode = this.dialog.completionDialog.execute();
      switch ( completionCode )
      {
      case CompletionDialog_doneContinue:
      case CompletionDialog_doneKeep:
      case CompletionDialog_doneRemove:
         // Nothing to do, only Continue makes sense above
         break;
      case CompletionDialog_doneLeave:
         this.dialog.ok();
         break;
      }
   };

   this.copy_Button = new PushButton( this );
   this.copy_Button.text = Text.T.COPY_BUTTON_TEXT;
   this.copy_Button.toolTip = Text.H.COPY_BUTTON_TOOLTIP;
   this.copy_Button.enabled = false;
   this.copy_Button.onClick = function()
   {
      // TODO Refactor with other actions
      if ( !this.parent.checkInputFileIndices() )
      {
         this.dialog.showCheckErrors( [ "The order of some column changed since last refresh, please refresh" ] );
         return;
      }
      var listOfFiles = this.parent.makeListOfCheckedFiles();
      var errors = this.parent.engine.checkValidTargets( listOfFiles );
      if ( errors.length > 0 )
      {
         this.dialog.showCheckErrors( errors );
         return;
      }
      try
      {
         console.show();
         this.dialog.cursor = new Cursor( StdCursor_Hourglass );
         var resultText = this.parent.engine.executeFileOperations( 1 );
      }
      finally
      {
         this.dialog.cursor = new Cursor( StdCursor_Arrow );
         //console.hide();
      }

      this.dialog.completionDialog.setResultText( resultText + "\nCopied files are still checked in the input list" );
      this.dialog.completionDialog.setResultModeCopy();
      var completionCode = this.dialog.completionDialog.execute();
      switch ( completionCode )
      {
      case CompletionDialog_doneContinue:
      case CompletionDialog_doneKeep:
         return;
         break;
      case CompletionDialog_doneRemove:
         for ( let iTreeBox = this.dialog.filesTreeBox.numberOfChildren; --iTreeBox >= 0; )
            if ( this.dialog.filesTreeBox.child( iTreeBox ).checked )
            {
               //               var nameInTreeBox = this.dialog.filesTreeBox.child(iTreeBox).text(0);
               var nameInTreeBox = this.dialog.filesTreeBox.child( iTreeBox ).fullFileName;
               this.dialog.engine.removeFiles( nameInTreeBox );
               this.dialog.filesTreeBox.remove( iTreeBox );
            }
         this.dialog.updateTotal();
         this.dialog.refreshTargetFiles();
         this.dialog.updateButtonState();
         break;
      case CompletionDialog_doneLeave:
         this.dialog.ok();
         break;
      }
   };

   this.loadSave_Button = new PushButton( this );
   this.loadSave_Button.text = Text.T.LOADSAVE_BUTTON_TEXT;
   this.loadSave_Button.toolTip = Text.H.LOADSAVE_BUTTON_TOOLTIP;
   this.loadSave_Button.enabled = false;
   this.loadSave_Button.onClick = function()
   {
      // TODO Refactor with other actions
      if ( !this.parent.checkInputFileIndices() )
      {
         this.dialog.showCheckErrors( [ "The order of some column changed since last refresh, please refresh" ] );
         return;
      }
      var listOfFiles = this.parent.makeListOfCheckedFiles();
      var errors = this.parent.engine.checkValidTargets( listOfFiles );
      if ( errors.length > 0 )
      {
         this.dialog.showCheckErrors( errors );
         return;
      }
      try
      {
         console.show();
         this.dialog.cursor = new Cursor( StdCursor_Hourglass );
         var resultText = this.parent.engine.executeFileOperations( 2 );
      }
      finally
      {
         this.dialog.cursor = new Cursor( StdCursor_Arrow );
         //console.hide();
      }

      this.dialog.completionDialog.setResultText( resultText + "\nLoad/saved files are still checked in the input list" );
      this.dialog.completionDialog.setResultModeCopy();
      var completionCode = this.dialog.completionDialog.execute();
      switch ( completionCode )
      {
      case CompletionDialog_doneContinue:
      case CompletionDialog_doneKeep:
         return;
         break;
      case CompletionDialog_doneRemove:
         for ( let iTreeBox = this.dialog.filesTreeBox.numberOfChildren; --iTreeBox >= 0; )
            if ( this.dialog.filesTreeBox.child( iTreeBox ).checked )
            {
               //var nameInTreeBox = this.dialog.filesTreeBox.child(iTreeBox).text(0);
               var nameInTreeBox = this.dialog.filesTreeBox.child( iTreeBox ).fullFileName;
               this.dialog.engine.removeFiles( nameInTreeBox );
               this.dialog.filesTreeBox.remove( iTreeBox );
            }
         this.dialog.updateTotal();
         this.dialog.refreshTargetFiles();
         this.dialog.updateButtonState();

         break;
      case CompletionDialog_doneLeave:
         this.dialog.ok();
         break;
      }
   };

#ifdef IMPLEMENTS_FITS_EXPORT
   // Export FITS values button
   this.txt_Button = new PushButton( this );
   this.txt_Button.text = "Export FITS.txt";
   this.txt_Button.toolTip = "For Checked files write FitKeywords value to file FITS.txt in output directory";
   this.txt_Button.enabled = false;
   this.txt_Button.onClick = function()
   {
      this.parent.engine.exportFITSKeywords();
   };
#endif

   this.exit_Button = new PushButton( this );
   this.exit_Button.text = "Exit";
   this.exit_Button.toolTip = "Exit (no action)";
   this.exit_Button.enabled = true;
   this.exit_Button.onClick = function()
   {
      if ( this.dialog.filesTreeBox.numberOfChildren == 0 ||
           (new MessageBox( "Do you really want to exit " + TITLE + " ?",
               TITLE, StdIcon_Question, StdButton_No, StdButton_Yes )).execute() == StdButton_Yes )
      {
         this.dialog.cancel();
      }
   };

   // Help buton
   this.helpButton = new ToolButton( this );
   this.helpButton.icon = this.scaledResource( ":/process-interface/browse-documentation.png" );
   this.helpButton.setScaledFixedSize( 24, 24 );
   this.helpButton.toolTip = Text.H.HELP_BUTTON_TOOLTIP;
   this.helpButton.onClick = function()
   {
      if ( !Dialog.browseScriptDocumentation( "FITSFileManager" ) )
         (new MessageBox( "<p>Documentation has not been installed.</p>",
            TITLE + "." + VERSION,
            StdIcon_Error,
            StdButton_Ok )).execute();
   };

   // Sizer for Operation List and Actions section

   this.buttonSizer = new HorizontalSizer;
   this.buttonSizer.margin = 4;
   this.buttonSizer.spacing = 6;
   this.buttonSizer.add( this.refresh_Button );
   this.buttonSizer.add( this.check_Button );
   this.buttonSizer.add( this.move_Button );
   this.buttonSizer.add( this.copy_Button );
   this.buttonSizer.add( this.loadSave_Button );
#ifdef IMPLEMENTS_FITS_EXPORT
   this.buttonSizer.add( this.txt_Button );
#endif
   this.buttonSizer.addStretch();
   this.buttonSizer.add( this.exit_Button );
   this.buttonSizer.add( this.helpButton );

   // --------------------------------------------------------------------------------------------
   // Sizer for dialog

   this.sizer = new VerticalSizer;
   this.sizer.margin = 4;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.barInput.addSection( this.sizer, 50 );
   this.barRules.addSection( this.sizer, 0 );
#ifdef FITSKEYS
   this.barFITS.addSection( this.sizer, 0 );
#endif
   this.barOutput.addSection( this.sizer, 0 );
   this.barResult.addSection( this.sizer, 50 );
   this.sizer.add( this.buttonSizer );

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setMinHeight();
   this.setScaledMinWidth( MainDialogMinWidth );
   this.width = this.smartMinWidth;

   //----------------------------------------------------------------------------------
   // -- Support methods
   //----------------------------------------------------------------------------------

   // -- Set visibility of synthetic and FITS keywords columns (called to apply changes)
   this.showOrHideFITSkey = function()
   {
      var allFITSKeyNames = this.engine.keywordsSet.allValueKeywordNameList;
      for ( let i = 0; i < ffM_Configuration.syntheticVariableNames.length; i++ )
      {
         // +1 as the file name column is always visible
         var c = i + 1;
         this.filesTreeBox.showColumn( c, this.engine.isVariableVisible( ffM_Configuration.syntheticVariableNames[ i ] ) );
      }
      for ( let i = 0; i < allFITSKeyNames.length; i++ )
      {
         // + 1 to skip file name and then skip the synthetic variables columns (they are present even if not shown))
         var c = i + 1 + ffM_Configuration.syntheticVariableNames.length;
         this.filesTreeBox.showColumn( c, this.engine.shownFITSKeyNames.hasOwnProperty( allFITSKeyNames[ i ] ) );
      }
   };

   // -- Rebuild the TreeBox content
   this.rebuildFilesTreeBox = function()
   {
      var keys, node, name, iKeyOfFile, k, displayFileName;

#ifdef DEBUG
      debug( "rebuildFilesTreeBox: rebuilding filesTreeBox - " + this.engine.inputFiles.length + " input files" );
#endif
      this.filesTreeBox.clear();
      this.filesTreeBox.numberOfColumns = 1; // Filename

      this.engine.keywordsSet = ffM_FITS_Keywords.makeKeywordsSet(); // clear

      // Add the synthetic keys columns
      for ( let iSynthKey = 0; iSynthKey < ffM_Configuration.syntheticVariableNames.length; iSynthKey++ )
      {
         var name = ffM_Configuration.syntheticVariableNames[ iSynthKey ];
         this.filesTreeBox.numberOfColumns++; // add new column
         this.filesTreeBox.setHeaderText( this.filesTreeBox.numberOfColumns - 1, name ); //set name of new column
#ifdef DEBUG
         debug( "rebuildFilesTreeBox: added synthetic key header '" + name + "' as col " + this.filesTreeBox.numberOfColumns );
#endif
      }

      // Add all lines (nodes), one for each file
      // The node will contain the file name, then the synthethic keys, then the FITS keys.
      // All synthethic and FITS keys are added, even if they are not shown or used (this simplifies some code,
      // but maybe could be optimized).
      // The list of synthethic keys is currently fixed.
      // The list of FITS key is dynamic and FITS keys coluns are added as needed when an image
      // has a FITS keyword not yet mapped to a column. The mapping of key name to column index
      // is built on the fly.
      // Only the keys with a value (not of type isNull) are considered (this skip comments)
      var longestFileName = "          "; // File name column will have at least 10 characters

      for ( let i = 0; i < this.engine.inputFiles.length; ++i )
      {
         if ( this.showFullPath )
            displayFileName = this.engine.inputFiles[ i ];
         else
            displayFileName = File.extractNameAndExtension( this.engine.inputFiles[ i ] );

         if ( displayFileName.length > longestFileName.length )
            longestFileName = displayFileName;

#ifdef DEBUG
         debug( "rebuildFilesTreeBox: adding file '" + this.engine.inputFiles[ i ] + "' to row " + i );
#endif
         var imageKeywords = this.engine.inputFITSKeywords[ i ]; // all FITS keywords/Values of the current file
         var keys = imageKeywords.fitsKeywordsList;
         var syntheticKeywords = this.engine.inputVariables[ i ]; // Map of all synthethic keywords and values of the current file

         // Create TreeBoxNode (line) for the current file
         var node = new TreeBoxNode( this.filesTreeBox );
         // put name of the file int the first column
         node.setText( 0, displayFileName );
         node.checked = true;
         // Keep full file name for retrievial by action methods (as the rows may be sorted)
         node.fullFileName = this.engine.inputFiles[ i ];
         // Reserve column for file name
         var colOffset = 1;

         // Add synthethic keyword columns (based on fixed list of syntethic keywords)
#ifdef DEBUG
         debug( "rebuildFilesTreeBox: adding " + Object.keys( syntheticKeywords ) + " synthetics keys, " + keys.length + " FITS keys to row " + i );
#endif
         for ( let iSynthKey = 0; iSynthKey < ffM_Configuration.syntheticVariableNames.length; iSynthKey++ )
         {
            var name = ffM_Configuration.syntheticVariableNames[ iSynthKey ];
            var textSynthKey = syntheticKeywords[ name ];
            node.setText( iSynthKey + colOffset, textSynthKey ? textSynthKey : "" );
         }
         // Skip next columns
         colOffset += ffM_Configuration.syntheticVariableNames.length;

         // Adding FITS keyword columns (based on FITS keywords in current file and map of keywords to column index)
#ifdef DEBUG
         debug( "rebuildFilesTreeBox: setting " + keys.length + " FITS keys to row " + i + ", colOffset=" + colOffset );
#endif
         for ( let iKeyOfFile = 0; iKeyOfFile < keys.length; iKeyOfFile++ )
         {
            var key = keys[ iKeyOfFile ];

            // Only show the value keywords (not the comment keywords)
            if ( !keys[ iKeyOfFile ].isNull )
            {
               var name = key.name; //name of Keyword from file
               var allFITSKeyNames = this.engine.keywordsSet.allValueKeywordNameList;
               var indexOfKey = allFITSKeyNames.indexOf( name ); // find index of "name" in allFITSKeyNames
               if ( indexOfKey < 0 )
               {
                  // new FITS keyword, not yet mapped to a column, add new value keyword
#ifdef DEBUG_COLUMNS
                  debug( "rebuildFilesTreeBox: Creating new column " + this.filesTreeBox.numberOfColumns + " for value keywords '" + name + "', total col len " + this.engine.allFITSKeyNames.size() );
#endif
                  allFITSKeyNames.push( name ); //add keyword name to table
                  this.filesTreeBox.numberOfColumns++; // add new column
                  this.filesTreeBox.setHeaderText( this.filesTreeBox.numberOfColumns - 1, name ); //set name of new column
                  indexOfKey = this.filesTreeBox.numberOfColumns - colOffset - 1;
               }
               // Set column content to value of keyword
#ifdef DEBUG_COLUMNS
               debug( "rebuildFilesTreeBox: Set column, colOffset " + colOffset + ", index " + indexOfKey + ", value " + keys[ iKeyOfFile ].value );
#endif
               var formattedValue = key.strippedValue;

               if ( key.isNumeric )
               {
                  // Remove leading 0 and trailing 0 of decimal values to use less space
                  var n = key.numericValue;
                  if ( n % 1 === 0 )
                  {
                     // Will be formatted without decimal point and leading 0
                     formattedValue = n.toString();
                  }
                  else
                  {
                     // TODO Supress possible leading zero of floating (leave 1 before decimal point)
                     formattedValue = key.strippedValue;
                  }
               }
               else
               {
                  formattedValue = ffM_FITS_Keywords.unquote( key.value );
               }
               node.setText( colOffset + indexOfKey, formattedValue );
            }
         }
      }

      // hide the columns of unchecked FITS keywords
      this.showOrHideFITSkey();

      // Keep the File name column reasonably sized
      if ( longestFileName.length > 80 )
         longestFileName = longestFileName.substr( 0, 80 );
      this.filesTreeBox.setColumnWidth( 0, this.font.width( longestFileName + "MMMM" ) );
   }; // this.rebuildFilesTreeBox = function()

   // -- enable/disable operation buttons depending on context
   this.updateButtonState = function()
   {
      let enabled = this.dialog.engine.canDoOperation();
      let canMoveOrCopy = enabled && !this.dialog.engine.someFilesAreConverted;
      this.dialog.move_Button.enabled = canMoveOrCopy;
      this.dialog.copy_Button.enabled = canMoveOrCopy;
      this.dialog.loadSave_Button.enabled = enabled;
#ifdef IMPLEMENTS_FITS_EXPORT
      this.dialog.txt_Button.enabled = enabled;
#endif
   };

   // -- Add a list of files to the TreeBox, refresh the TreeBox
   this.addFilesAction = function( fileNames )
   {
#ifdef DEBUG
      debug( "addFilesAction - adding " + fileNames.length + " files" );
#endif
      try
      {
         this.cursor = new Cursor( StdCursor_Hourglass );

         this.engine.addFiles( fileNames );

         this.rebuildFilesTreeBox();
         //this.adjustToContents();
         this.dialog.updateTotal();
         this.refreshTargetFiles();
         this.dialog.updateButtonState();
#ifdef DEBUG
         debug( "addFilesAction - added " + fileNames.length + " files" );
#endif
      }
      finally
      {
         this.cursor = new Cursor( StdCursor_Arrow );
      }
   };

   // -- Update the input file list total after each add/remove/check toggle
   this.updateTotal = function()
   {
      // Should be same as this.engine.inputFiles.length
      var countTotal = this.filesTreeBox.numberOfChildren;
      var countChecked = 0;
      for ( let iTreeBox = 0; iTreeBox < this.filesTreeBox.numberOfChildren; ++iTreeBox )
         if ( this.filesTreeBox.child( iTreeBox ).checked )
            countChecked += 1;
      var countText;
      if ( countTotal === 0 && countChecked === 0 )
         countText = "No file";
      else if ( countChecked === 0 )
         countText = "No checked file / " + countTotal + " file" + ( countTotal > 1 ? "s" : "" );
      else
         countText = "" + countChecked + " checked file" + ( countChecked > 1 ? "s" : "" ) + " / " + countTotal + " file" + ( countTotal > 1 ? "s" : "" );
      this.inputSummaryLabel.text = countText;
      this.barInput.setCollapsedTitle( "Input - " + countText );
   };

   // -- Return an array of the files that have the check box ticked, in the order of the input TreeBox
   //    See also refreshTargetFiles
   this.makeListOfCheckedFiles = function()
   {
      var listOfFiles = [];
      for ( let iTreeBox = 0; iTreeBox < this.filesTreeBox.numberOfChildren; ++iTreeBox )
         if ( this.filesTreeBox.child( iTreeBox ).checked )
         {
            // Select name in tree box (from a field, as the text itself may have been modified
            // for display purpose), find corresponding file in inputFiles
            var nameInTreeBox = this.filesTreeBox.child( iTreeBox ).fullFileName;
            listOfFiles.push( nameInTreeBox );
         }
      return listOfFiles;
   };

   // -- Make a list of all files in the input TreeBox
   this.makeListOfInputFiles = function()
   {
      let listOfFiles = [];
      for ( let iTreeBox = 0; iTreeBox < this.filesTreeBox.numberOfChildren; ++iTreeBox )
      {
         let nameInTreeBox = this.filesTreeBox.child( iTreeBox ).fullFileName;
         listOfFiles.push( nameInTreeBox );
      }
      return listOfFiles;
   };

   // -- Mark each input node with its current index in the input TreeBox
   this.markInputFileIndices = function()
   {
      let listOfInputFiles = this.makeListOfInputFiles();
      for ( let iTreeBox = 0; iTreeBox < this.filesTreeBox.numberOfChildren; ++iTreeBox )
         this.filesTreeBox.child( iTreeBox ).treeBoxIndex = iTreeBox;
   };

   // -- Check that tree box are still in the same order as during the mark
   this.checkInputFileIndices = function()
   {
      let listOfInputFiles = this.makeListOfInputFiles();
      for ( let iTreeBox = 0; iTreeBox < this.filesTreeBox.numberOfChildren; ++iTreeBox )
         if ( this.filesTreeBox.child( iTreeBox ).treeBoxIndex !== iTreeBox )
            return false;
      return true;
   };

   // -- Update the output operations indications
   this.refreshTargetFiles = function()
   {
#ifdef DEBUG
      debug( "refreshTargetFiles() called" );
#endif
      this.markInputFileIndices();

      // See also makeListOfCheckedFiles
      // Make a list of the checked files, with a parallel list of their indices in the source TreeBox
      var listOfCheckedFiles = [];
      var listOfCheckedFilesIndex = [];

      for ( let iTreeBox = 0; iTreeBox < this.filesTreeBox.numberOfChildren; ++iTreeBox )
         if ( this.filesTreeBox.child( iTreeBox ).checked )
         {
            // Select name in tree box (from a field, as the text itself may have been modified
            // for display purpose), find corresponding file in inputFiles
            var nameInTreeBox = this.filesTreeBox.child( iTreeBox ).fullFileName;
            listOfCheckedFiles.push( nameInTreeBox );
            listOfCheckedFilesIndex.push( iTreeBox );
         }

      // List of text accumulating the transformation rules for display
      var listsOfTransforms = this.engine.makeListsOfTransforms( listOfCheckedFiles, listOfCheckedFilesIndex );

      this.transform_TreeBox.clear();
      var firstNode = null;
      for ( let i = 0; i < listsOfTransforms.inputFiles.length; i++ )
      {
         var inputFile = listsOfTransforms.inputFiles[ i ];
         var inputFileIndex = listsOfTransforms.inputFileIndices[ i ];
         //console.writeln("** refreshTargetFiles " + i + " " + inputFileIndex + " " + inputFile);
         var targetFile = listsOfTransforms.targetFiles[ i ];
         var errorMessage = listsOfTransforms.errorMessages[ i ];

         var sourceNode = new TreeBoxNode( this.transform_TreeBox );
         if ( i === 0 )
            firstNode = sourceNode
         sourceNode.setText( 0, "File ".concat( inputFile ) );
         sourceNode.inputFileIndex = inputFileIndex;

         var resultNode = new TreeBoxNode( this.transform_TreeBox );
         if ( targetFile )
            resultNode.setText( 0, "  to .../".concat( targetFile ) );
         else
         {
            resultNode.setText( 0, "     Error ".concat( errorMessage ) );
            resultNode.setTextColor( 0, 0x00FF0000 );
         }
         resultNode.inputFileIndex = inputFileIndex;
      }

      if ( firstNode )
      {
         // Scroll to beginning
         this.transform_TreeBox.currentNode = firstNode;
         // But do not select
         firstNode.selected = false;
      }

      var nmbFilesExamined = this.engine.targetFiles.length;

      var barResultTitle = "";
      if ( nmbFilesExamined === 0 )
         barResultTitle += "No operation";
      else
      {
         barResultTitle += "" + nmbFilesExamined + " files checked";
         if ( this.engine.nmbFilesTransformed > 0 )
            barResultTitle += ", " + this.engine.nmbFilesTransformed + " to copy/move";
         //      this.engine.nmbFilesSkipped;
         if ( this.engine.nmbFilesInError > 0 )
            barResultTitle += ", " + this.engine.nmbFilesInError + " IN ERROR";
      }
      this.outputSummaryLabel.text = barResultTitle;
      this.barResult.setCollapsedTitle( "Resulting operations - " + barResultTitle );
   }; // this.refreshTargetFiles = function()

   // -- Support for refresh and move, remove all input files that are not present anymore in the file system
   this.removeDeletedFiles = function()
   {
      for ( let iTreeBox = this.dialog.filesTreeBox.numberOfChildren; --iTreeBox >= 0; )
      {
         //var nameInTreeBox = this.dialog.filesTreeBox.child(iTreeBox).text(0);
         var nameInTreeBox = this.dialog.filesTreeBox.child( iTreeBox ).fullFileName;
         if ( !File.exists( nameInTreeBox ) )
         {
#ifdef DEBUG
            debug( "File '" + nameInTreeBox + "' removed from input list as not present on file system anymore." );
#endif
            this.dialog.engine.removeFiles( nameInTreeBox );
            this.dialog.filesTreeBox.remove( iTreeBox );
         }

         this.dialog.updateTotal();
         this.dialog.updateButtonState();
         // Caller must refresh the generated files
      }
   };
}

MainDialog.prototype = new Dialog;

// ========================================================================================================================
// Completion dialog
// ========================================================================================================================

function CompletionDialog( parentDialog, engine )
{
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = Text.T.COMPLETION_TITLE;

   this.resultBox = new TextBox( this );
   this.resultBox.readOnly = true;
   this.resultBox.text = "TEXT NOT INITIALIZED";
   this.resultBox.setScaledMinSize( 600, 200 );
   this.resultBox.caretPosition = 0;

   this.continue_Button = new PushButton( this );
   this.continue_Button.text = Text.T.COMPLETION_CONTINUE_BUTTON_TEXT;
   this.continue_Button.toolTip = Text.H.COMPLETION_CONTINUE_BUTTON_TOOLTIP;
   this.continue_Button.enabled = true;
   this.continue_Button.onClick = function()
   {
      this.dialog.done( CompletionDialog_doneContinue );
   };
   this.keep_Button = new PushButton( this );
   this.keep_Button.text = Text.T.COMPLETION_KEEP_BUTTON_TEXT;
   this.keep_Button.toolTip = Text.H.COMPLETION_KEEP_BUTTON_TOOLTIP;
   this.keep_Button.enabled = true;
   this.keep_Button.onClick = function()
   {
      this.dialog.done( CompletionDialog_doneKeep );
   };
   this.remove_Button = new PushButton( this );
   this.remove_Button.text = Text.T.COMPLETION_REMOVE_BUTTON_TEXT;
   this.remove_Button.toolTip = Text.H.COMPLETION_REMOVE_BUTTON_TOOLTIP;
   this.remove_Button.enabled = true;
   this.remove_Button.onClick = function()
   {
      this.dialog.done( CompletionDialog_doneRemove );
   };
   this.leave_Button = new PushButton( this );
   this.leave_Button.text = Text.T.COMPLETION_LEAVE_BUTTON_TEXT;
   this.leave_Button.toolTip = Text.H.COMPLETION_LEAVE_BUTTON_TOOLTIP;
   this.leave_Button.enabled = true;
   this.leave_Button.onClick = function()
   {
      this.dialog.done( CompletionDialog_doneLeave );
   };

   // Sizer for Operation List and Actions section

   this.buttonSizer = new HorizontalSizer;
   this.buttonSizer.spacing = 2;
   this.buttonSizer.add( this.continue_Button );
   this.buttonSizer.add( this.keep_Button );
   this.buttonSizer.add( this.remove_Button );
   this.buttonSizer.add( this.leave_Button );
   this.buttonSizer.addStretch();

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.add( this.resultBox );
   this.sizer.add( this.buttonSizer );
   this.adjustToContents();

   this.setResultText = function( text )
   {
      this.resultBox.text = text;
   };
   this.setResultModeMove = function()
   {
      this.continue_Button.enabled = true;
      this.keep_Button.enabled = false;
      this.remove_Button.enabled = false;
   };
   this.setResultModeCopy = function()
   {
      this.continue_Button.enabled = false;
      this.keep_Button.enabled = true;
      this.remove_Button.enabled = true;
   };
}

CompletionDialog.prototype = new Dialog;

// ========================================================================================================================
// FITS and synthetic keys dialog
// ========================================================================================================================
// Present a dialog with:
//   A selection of the files (drop down)
//   A list of  FITS keywords (selection box, keyword, value)  of the selected file, as a TreeBox
// ---------------------------------------------------------------------------------------------------------
function FITSKeysDialog( parentDialog, engine )
{
   this.__base__ = Dialog;
   this.__base__();
   this.windowTitle = "Select FITS keywords to show in main window";

   // ComboBox to select the file to display values
   this.file_ComboBox = new ComboBox( this );

   // A file was selected (also called to initialize)
   this.file_ComboBox.onItemSelected = function( indexInComboBox )
   {
      var fileName = this.itemText( indexInComboBox );
      var indexInFiles = engine.inputFiles.indexOf( fileName );
#ifdef DEBUG
      debug( "FITSKeysDialog: file_ComboBox: onItemSelected(" + indexInComboBox + ") -  indexInFiles = " + indexInFiles + ", keywordsSet.size() = " + engine.keywordsSet.size() );
#endif

      this.dialog.populate( indexInFiles );

   };

   // TreeBox to display list of FITS keywords
   this.keyword_TreeBox = new TreeBox( this );
   this.keyword_TreeBox.toolTip = "Synthetic and value keywords of the image selected in the drop box at top,\n" +
      "Tick the check mark to include the keyword value in the input file table\n" +
      "The red color indicates that the keyword is not in the selected image, but appears in some other loaded images,\n" +
      "or that its value is space (it will be considered missing).";
   this.keyword_TreeBox.rootDecoration = false;
   this.keyword_TreeBox.numberOfColumns = 3;
   this.keyword_TreeBox.setHeaderText( 0, "name" );
   this.keyword_TreeBox.setHeaderText( 1, "value" );
   this.keyword_TreeBox.setHeaderText( 2, "type" );
   this.keyword_TreeBox.setHeaderText( 3, "comment" );
   this.keyword_TreeBox.setColumnWidth( 0, 150 );
   this.keyword_TreeBox.setColumnWidth( 1, 200 );
   this.keyword_TreeBox.setColumnWidth( 2, 50 );
   this.keyword_TreeBox.setColumnWidth( 3, 600 );

   // Buttons
   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.enabled = true;
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };
   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.enabled = true;
   this.ok_Button.onClick = function()
   {
#ifdef DEBUG
      debug( "FITSKeysDialog: ok_Button: onClick - save check/uncheck status in shownFITSKeyNames " );
#endif
      let fitsRoootNode = this.parent.keyword_TreeBox.child( 1 );
      let allFITSKeyNames = engine.keywordsSet.allValueKeywordNameList;
      // Clear and rebuild list of keywords to show
      engine.shownFITSKeyNames = {};
      for ( let i = 0; i < allFITSKeyNames.length; i++ )
      {
         let checked = fitsRoootNode.child( i ).checked; // List and rows are in same order
         let name = allFITSKeyNames[ i ];
         if ( checked )
            engine.shownFITSKeyNames[ name ] = true;
      }
      let variableRoootNode = this.parent.keyword_TreeBox.child( 0 );
      // TODO Delegate operation to engine
      engine.shownSyntheticKeyNames = {};
      for ( let i = 0; i < ffM_Configuration.syntheticVariableNames.length; i++ )
      {
         let checked = variableRoootNode.child( i ).checked; // List and rows are in same order
         let name = ffM_Configuration.syntheticVariableNames[ i ];
         if ( checked )
            engine.shownSyntheticKeyNames[ name ] = true;
      }
      this.dialog.ok();
   };

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.spacing = 2;
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.cancel_Button );
   this.buttonsSizer.add( this.ok_Button );

   // Assemble FITS keyword Dialog
   this.sizer = new VerticalSizer;
   this.sizer.margin = 4;
   this.sizer.spacing = 4;
   this.sizer.add( this.file_ComboBox );
   this.sizer.add( this.keyword_TreeBox );
   this.sizer.add( this.buttonsSizer );
   this.adjustToContents();

   // ------------------------------------------------------------
   // Recreate the content when the dialog is showns
   // This method recreate the columnsm key names, populate the list of file and call initializer for data
   this.onShow = function()
   {
#ifdef DEBUG
      debug( "FITSKeysDialog: file_ComboBox: onShow()" );
#endif
      // -- Locate dialog
      var p = new Point( parentDialog.position );
      p.moveBy( 16, 16 );
      this.position = p;

      // -- Update the DropDown box - Fill list of files from parent list of files, to be in the same order
      // Note - this requires finding the proper index in inputFile[] when a selection is done, as order may be different
      this.file_ComboBox.clear();
      for ( let i = 0; i < parentDialog.filesTreeBox.numberOfChildren; i++ )
      {
         //         this.file_ComboBox.addItem(parentDialog.filesTreeBox.child(i).text(0));
         this.file_ComboBox.addItem( parentDialog.filesTreeBox.child( i ).fullFileName );
      }
      ////    OLD: This is filling the list in the loaded file order
      //      for (i = 0; i< engine.inputFiles.length; i++) {
      //         this.file_ComboBox.addItem(engine.inputFiles[i]);
      //      }

      var selectedFileIndex = 0;
      var fileIndex = 0;
      if ( parentDialog.filesTreeBox.selectedNodes.length > 0 )
      {
         // Show first selected node
         var firstSelectedNode = parentDialog.filesTreeBox.selectedNodes[ 0 ];
         //         var fileName = firstSelectedNode.text(0);
         var fileName = firstSelectedNode.fullFileName;
         fileIndex = engine.inputFiles.indexOf( fileName );
         selectedFileIndex = parentDialog.filesTreeBox.childIndex( firstSelectedNode );
#ifdef DEBUG
         debug( "FITSKeysDialog: file_ComboBox: onShow - fileName=" + fileName + ", fileIndex=" + fileIndex + ", selectedFileIndex=" + selectedFileIndex );
#endif
      }
      // Select the file in the combo box
      this.file_ComboBox.currentItem = selectedFileIndex;

      // -- Rebuild the 3 lists of keywords in the tree box

      this.keyword_TreeBox.clear();

      // Create list of synthetic keywords as a fist subtree
      var synthRootNode = new TreeBoxNode( this.keyword_TreeBox );
      synthRootNode.expanded = true;
      synthRootNode.setText( 0, "Synthetic keywords" );

      // Fill the name column from the list of all synthetic keywords names
      for ( let i = 0; i < ffM_Configuration.syntheticVariableNames.length; i++ )
      {
         let node = new TreeBoxNode( synthRootNode );
         node.setText( 0, ffM_Configuration.syntheticVariableNames[ i ] );
         node.checked = engine.isVariableVisible( ffM_Configuration.syntheticVariableNames[ i ] );;
      }

      // Create list of FITS keywords used as variables as a second subtree
      var fitsVarRootNode = new TreeBoxNode( this.keyword_TreeBox );
      fitsVarRootNode.expanded = true;
      fitsVarRootNode.setText( 0, "Valued FITS keywords" );

      // Fill the name columns from the from allFITSKeyNames (accumulated names of all keywords)
      var allFITSKeyNames = engine.keywordsSet.allValueKeywordNameList;
      for ( let i = 0; i < allFITSKeyNames.length; i++ )
      {
         var node = new TreeBoxNode( fitsVarRootNode );
         node.setText( 0, allFITSKeyNames[ i ] );
         node.checked = engine.shownFITSKeyNames.hasOwnProperty( allFITSKeyNames[ i ] );
      }

      // Populate with default file
      this.populate( fileIndex );

      // Ensure that something reasonable is visible so the user can
      // figure out what to do, but try to make it large to be convenient,
      // hopefully this should work on small screens.
      // adjustToContents result in too small a window.
      this.setScaledMinSize( FitsKeysDialogMinimumWidth, FitsKeysDialogMinimumHeight );
      this.width = FitsKeysDialogPreferedWidth;
      this.height = FitsKeysDialogPreferedHeight;
   }; // this.onShow = function()

   this.getTypeString = function( fitsKey )
   {
      if ( fitsKey.isBoolean )
         return "bool";
      if ( fitsKey.isNumeric )
         return "num";
      if ( fitsKey.isString )
         return "str";
      if ( fitsKey.isNull )
         return "null";
      return "";
   };

   // Populate from information of inputFile[index] and inputFITSKeywords[index]
   this.populate = function( index )
   {
#ifdef DEBUG
      debug( "FITSKeysDialog: file_ComboBox: populate() - index=" + index + " for file " + engine.inputFiles[ index ] );
#endif

      // Update the values of the synthethic keywords from a predefined list and engine values
      var synthRootNode = this.keyword_TreeBox.child( 0 );

      for ( let i = 0; i < ffM_Configuration.syntheticVariableNames.length; i++ )
      {
         var keyName = ffM_Configuration.syntheticVariableNames[ i ];
         var variables = engine.inputVariables[ index ];
         var variable = variables[ keyName ];
         if ( variable !== null )
         {
            synthRootNode.child( i ).setTextColor( 0, 0x00000000 );
            // TODO ADHOC TEMPORARY TEST
            if ( typeof variable !== 'string' )
               variable = '?[' + typeof variable + ']';

            synthRootNode.child( i ).setText( 1, variable );
            synthRootNode.child( i ).setText( 2, '' );
            synthRootNode.child( i ).setText( 3, ffM_Configuration.syntheticVariableComments[ i ] );
         }
         else
         {
            synthRootNode.child( i ).setTextColor( 0, 0x00FF0000 );
            synthRootNode.child( i ).setText( 1, '' );
            synthRootNode.child( i ).setText( 2, '' );
            synthRootNode.child( i ).setText( 3, '' );
         }
      }

      // Update FITS key words values from engine information
      var fitsVarRootNode = this.keyword_TreeBox.child( 1 );

      var allFITSKeyNames = engine.keywordsSet.allValueKeywordNameList;
      var imageKeywords = engine.inputFITSKeywords[ index ];
      for ( let i = 0; i < allFITSKeyNames.length; i++ )
      {
         var keyName = allFITSKeyNames[ i ];
         var keyValue = imageKeywords.getValueKeyword( keyName );
#ifdef DEBUG_FITS
         debug( "FITSKeysDialog: populate(): FITS  keyName=" + keyName + ",  keyValue=" + keyValue );
#endif
         if ( keyValue === null )
         {
            // No value at all
            fitsVarRootNode.child( i ).setTextColor( 0, 0x00FF0000 ); // Red
            fitsVarRootNode.child( i ).setText( 1, '' );
            fitsVarRootNode.child( i ).setText( 2, '' );
            fitsVarRootNode.child( i ).setText( 3, '' );
         }
         else
         {
            var nullOrValue = ffM_variables.filterFITSValue( keyValue.value );
            if ( nullOrValue === null )
            {
               // All spaces value
               fitsVarRootNode.child( i ).setTextColor( 0, 0x00FF0000 ); // Red
               fitsVarRootNode.child( i ).setText( 1, keyValue.value );
               fitsVarRootNode.child( i ).setText( 2, this.getTypeString( keyValue ) );
               fitsVarRootNode.child( i ).setText( 3, keyValue.comment );
            }
            else
            {
               // Non empty string, number or boolean
               fitsVarRootNode.child( i ).setTextColor( 0, 0x00000000 );
               fitsVarRootNode.child( i ).setText( 1, keyValue.value );
               fitsVarRootNode.child( i ).setText( 2, this.getTypeString( keyValue ) );
               fitsVarRootNode.child( i ).setText( 3, keyValue.comment );
            }
         }
      }
   }; // this.populate = function()
}

FITSKeysDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF FITSFileManager-gui.jsh - Released 2020-01-27T18:07:10Z
