// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// VaryParams-gui.jsh - Released 2013/12/03 16:15:08 UTC
// ****************************************************************************
//
// This file is part of VaryParams script version 1.5
//
// The complete source code with test scripts is hosted at:
//    https://bitbucket.org/bitli/varyparams
//
// Copyright (c) 2012-2013 Jean-Marc Lugrin
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
// ****************************************************************************

#include <pjsr/DataType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>

// The user interface is a module that depends only on the 'environment' object
// (defined in the helper module), but not on the engine or other execution context.
// This separation of concerns ease testing and modifications.
//
// The GUI manages the 'GUI parameters' that represent the user view of what must be
// achieved with the process.

// Operations exported:
//   Vp_GUIParameters(environment) constructor
//   Vp_VaryParamsDialog(environment, guiParameters) constructor


// ------------------------------------------------------------------------------------------------------------------------
// User Interface Parameters
// ------------------------------------------------------------------------------------------------------------------------

// The GUI parameters keeps track of this information in
// a form easy to be saved and presented to the user.  The GUI parameters also keeps track
// of GUI state information that are not saved as parameters (for example the list of
// parameters that can be selected for a process).  If this information becomes too complex
// it could be moved to a separate 'GUI state' object.

// Some information useful to initialize the GUI parameters or to provide initial or valid list
// of options to the user (as the list of process icons) are provided in the form of an
// 'vP_Environment' object, define in the file VaryParams-helpers.
// If additional information about the environment is required
// it should be provided via that object.  This ensures that all dependencies from the GUI
// to the environment is in one place, easy to modify, trace or mock for testing purposes.



#define VP_RESULT_UNDEFINED (-1)
#define VP_RESULT_IN_FILES 0
#define VP_RESULT_IN_WINDOWS 1
#define VP_RESULT_IN_PREVIEWS 2

#define VP_SETTINGS_KEY_BASE  "VaryParams/"

// ---------------------------------------------------------------------------------------------------------------
// Define texts
// ---------------------------------------------------------------------------------------------------------------

#define VP_ABOUT_TEXT ("<b>" + TITLE + " v" + VERSION + "</b> &mdash; A script that executse a process " + \
           "varying one parameter. Each execution will normally create one or more new image " + \
           "with a unique identifier. The image may be saved to a file or a preview. " + \
           "<br/>See the help for more details.")

#define VP_HELP_TEXT "<html><h1><font color=\"#06F\">VaryParams</font></h1>\
VaryParams executes a procesess icon iteratively, varying one parameter, \
and saving the resulting images in new windows, new files or as new previews. This is handy to test \
the impact of parameters on a process, especially using Blink on the generated \
files or preview navigation (Ctrl /right and Ctrl/left) on the generated previews. \
<h3><font color=\"#06F\">Operations</font></h3>\
You must first have one or more Process Icon in your project (it is recommended \
that you give them a meaningful name). You can create Process Icon by dragging \
the lower left triangle of an open process to the Desktop.<br/> \
You must select a view or a preview to operate upon (unless the process must \
be executed globally, in which case the view can be ignored). \
You execute VaryParams.js and complete the form as follow: \
<ol>\
  <li>In the field <em>Process to execute</em>, select the process icon name. Only process that are \
  applicable globally or to the selected view are shown. Some process may be applicable to a view \
  but not to a preview (for example DBE), in that case they are not shown if you selected a preview.</li>\
  <li>The field <em>Type of process</em> specifies if the process updates the image (as ACDNR), if \
     it generates \
     a new image from the selected image (as StarMask) or if it operates globally (like StarGenerator). \
     This is <b>not</b> what you want to do, but what the process usually does. \
     VaryParams is normally able to find the value itself and the control will be disabled. \
     A global process must generate an image in the workspace to be useable by VaryParams, \
     for example CosmeticCorrection only generate files, so it cannot currently be driven by \
     VaryParams.</li>\
  <li>Select the <em>Parameter to vary</em>. All parameters of the process are presented. Some \
     may not make sense to vary as they impact the process itself (for \
     example if a process must modify the source view or create a new one).</li>\
  <li>Enter the <em>List of values</em> separated by comma. If the \
     values are strings (as the expression of PixMath) they must be \
     enclosed in quotes (the technical format is JSON, without the external brakets).\
     Array values are also supported, for example the parameter 'layers' of ATWT. \
     Arrays are enclosed in square brackets.</li>\
  <li>Select how to dispose the result in the field <em>Type of output</em>. \
     You can leave the resulting images on the workspace \
     as new images, save them in files (required to use Blink) or keep the \
     result as previews of the original image. Saving the resul as preview is \
     only possible for processes that modify the source view and can work on preview).<br/>\
     You may choose to generate results as preview even if you selected a main view \
     as the source. In that case a preview covering the whole view will be created. \
  <li>Possibly adapt other parameters (output directory, delete other previews). \
      They can be changed only if they are applicable.</li>\
</ol>\
VaryParams saves the current values of the parameters and propose them if you relaunch it, \
but only if they are still applicable (if the process still exists and is applicable to the current view).\
<p>\
Executing a process with many values may be quite \
resource intensive and \
may be difficult to abort. Some resources are not immediately or fully \
released before the script is completed. If you have a low end machine, first try on a preview \
and/or with a limited number of values. \
<h3><font color=\"#06F\">Limitations</font></h3>\
<ul>\
<li>VaryParams cannot execute scripts, ProcessContainer and process that only generate files as StarMask and CosmeticCorrection.</li>\
<li>The name of the parameters is obtained by examining the properties of the process. This means that \
  the name of the parameters may not be the same as the one you see in the GUI of the \
  corresponding process. The current value of the parameter is also \
  shown to help you identify the desired parameter. \
  <br/>Trick: enter a specific value easy to recognize in the process before statring VaryParams.</li>\
<li>If the parameter is a named constant (like a mode of operation), you must find \
  and enter the appropriate code value (a number or a string, not the name of the constant).</li>\
<li>There is currently no way to configure/launch Blink automatically with \
  the generated files.</li>\
<li>VaryParams works only on unmodified (saved) windows, as it must detect if the \
  source view was modified during its process. It will prompt you if the \
  window is modified but not saved.</li>\
</ul>\
</html>"



#define DEFAULT_COMBOX_TOOLTIP   "Select how the result will be saved. This must be consistent with the way the process works. \
<br/><em>Keep resulting view on workspace</em> will copy the view with the mask (if required), apply the process and leave the view on the workspace. \
<br/><em>Save resulting view to file and close</em> will copy the view with the mask (if required), apply the process, save the \
resulting window to a new file and close it. This is useful with Blink. \
<br/><em>Keep resulting view as preview</em> works only on processes that update the source image, it will create a preview \
of the full image or a copy of the current preview (if a preview is selected) and apply the process ot it."

#define PROCESS_ICONS_TOOLTIP "Select the process icon that you want to execute varying the value of one of its parameters. \
<br/>Only processes that apply globaly or to the selected view are shown. \
<br/>Some process may be applicable to a view but not to a preview (like DBE)."

// ---------------------------------------------------------------------------------------------------------------
// Support the saved and working GUI parameters in a single objects
// ---------------------------------------------------------------------------------------------------------------

function Vp_GUIParameters(environment) {

   this.reset = function (environment) {

      // -- SETTINGS - Start of saved parameters, initialize to default values
      this.processInstanceName = "";
      this.processType = "";
      this.parameterToVary = "";
      this.parameterValuesText = "";
      this.operateOn = VP_OPERATE_UNDEFINED;
      this.resultDestination = VP_RESULT_UNDEFINED;
      this.outputDirectory = environment.defaultOutputDirectory;
      this.deleteOtherPreviews = false;
      this.overwriteOutputFiles = false;
      // SETTINGS - End of saved parameters

      // -- GUI parameters for current session
      this.sourceView = environment.getCurrentView();
      // ProcessMode will be updated from the capabilities of the process instance
      this.processModeChoice = [];
      // Parameter information will be updated from the properties of the process instance
      this.listOfparameterNames = null;
      this.listOfparameterOriginalValues = null;

      // Fixed - order of destination in combobox
      this.resultDestinationChoice = [VP_RESULT_IN_WINDOWS,VP_RESULT_IN_FILES,VP_RESULT_IN_PREVIEWS];

   }
   this.reset(environment);


   // For debugging and logging
   this.toString = function() {
      var s = "GUIParameters: (* is saved settings)\n";
      s += "  *processInstanceName:          " + this.processInstanceName + "\n";
      s += "  *processType:                  " + this.processType + "\n";
      s += "  *parameterToVary:              " + this.parameterToVary + "\n";
      s += "  *parameterValuesText:          " + this.parameterValuesText + "\n";
      s += "  *operateOn:                    " + this.operateOn + "\n";
      s += "  *resultDestination:            " + this.resultDestination + "\n";
      s += "  *outputDirectory:              " + this.outputDirectory + "\n";
      s += "  *deleteOtherPreviews:          " + this.deleteOtherPreviews + "\n";
      s += "  *overwriteOutputFiles:         " + this.overwriteOutputFiles + "\n";

      s += "  sourceView:                    " + (this.sourceView == null ? "null" : this.sourceView.fullId) + "\n";
      s += "  processModeChoice:             " + this.processModeChoice + "\n";
      s += "  listOfParameterNames:          " + this.listOfParameterNames + "\n";
      s += "  listOfParameterOriginalValues: " + this.listOfParameterOriginalValues + "\n";
      return s;
   }
}

Vp_GUIParameters.prototype.loadSettings = function()
{
   function load( key, type )
   {
      var setting = Settings.read( VP_SETTINGS_KEY_BASE + key, type );
#ifdef DEBUG
      Console.writeln("Vp_GUIParameters.load: ", key, ": ", ("" + setting));
#endif
      return setting;
   }

   function loadIndexed( key, index, type )
   {
      return load( key + '_' + index.toString(), type );
   }

   var o;
   if ( (o = load( "version",    DataType_Double )) != null ) {
      if (o > VERSION) {
         Console.writeln("Warning: Settings '", VP_SETTINGS_KEY_BASE, "' have version ", o, " later than script version ", VERSION, ", settings ignored");
      } else {
         if ( (o = load( "processInstanceName",    DataType_String )) != null )
            this.processInstanceName = o;
         if ( (o = load( "processType",            DataType_String )) != null )
            this.processType = o;
         if ( (o = load( "parameterToVary",        DataType_String )) != null )
            this.parameterToVary = o;
         if ( (o = load( "parameterValuesText",    DataType_String )) != null )
            this.parameterValuesText = o;
         if ( (o = load( "operateOn",              DataType_Int8 )) != null )
            this.operateOn = o;
         if ( (o = load( "resultDestination",      DataType_Int8 )) != null )
            this.resultDestination = o;
         if ( (o = load( "outputDirectory",        DataType_String )) != null )
            this.outputDirectory = o;
         if ( (o = load( "deleteOtherPreviews",    DataType_Boolean )) != null )
            this.deleteOtherPreviews = o;
         if ( (o = load( "overwriteOutputFiles",   DataType_Boolean )) != null )
            this.overwriteOutputFiles = o;
      }
   } else {
      Console.writeln("Warning: Settings '", VP_SETTINGS_KEY_BASE, "' do not have a 'version' key, settings ignored");
   }

};

Vp_GUIParameters.prototype.saveSettings = function()
{
   function save( key, type, value ) {
#ifdef DEBUG
      Console.writeln("saveSettings: key=",key,", type=", type, ", value =" ,""+value);
#endif
      Settings.write( VP_SETTINGS_KEY_BASE + key, type, value );
   }

   function saveIndexed( key, index, type, value ) {
#ifdef DEBUG
      Console.writeln("saveSettings: key=",key,", index=", index, ", type=", type, ", value =" ,""+value);
#endif
      save( key + '_' + index.toString(), type, value );
   }

   save( "version",                 DataType_Double,  parseFloat(VERSION) );
   save( "processInstanceName",     DataType_String,  this.processInstanceName );
   save( "processType",             DataType_String,  this.processType );
   save( "parameterToVary",         DataType_String,  this.parameterToVary );
   save( "parameterValuesText",     DataType_String,  this.parameterValuesText );
   save( "operateOn",               DataType_Int8,    this.operateOn );
   save( "resultDestination",       DataType_Int8,    this.resultDestination );
   save( "outputDirectory",         DataType_String,  this.outputDirectory );
   save( "deleteOtherPreviews",     DataType_Boolean, this.deleteOtherPreviews );
   save( "overwriteOutputFiles",    DataType_Boolean, this.overwriteOutputFiles );

}





// ------------------------------------------------------------------------------------------------------------------------
// Help Dialogs
// ------------------------------------------------------------------------------------------------------------------------


// See http://pixinsight.com/developer/pcl/doc/20120901/html/classpcl_1_1Console.html
// for formatting instructions

function HelpDialog( parentDialog, engine )
{
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = "VaryParams Help";

   this.helpBox = new TextBox( this );
   this.helpBox.readOnly = true;
   this.helpBox.text = VP_HELP_TEXT;
   this.helpBox.setScaledMinSize( 800, 400 );
   this.helpBox.caretPosition = 0;

   this.sizer = new HorizontalSizer;
   this.sizer.margin = 6;
   this.sizer.add( this.helpBox );
   this.setVariableSize();
   this.adjustToContents();
}

HelpDialog.prototype = new Dialog;


// ------------------------------------------------------------------------------------------------------------------------
// Main Dialogs
// ------------------------------------------------------------------------------------------------------------------------

function Vp_VaryParamsDialog(anEnvironment, guiParameters)
{
   this.__base__ = Dialog;
   this.__base__();


   var theDialog = this;

   this.theEnvironment = anEnvironment;
   this.theParameters = guiParameters;


#ifdef DEBUG
   Console.writeln("Vp_VaryParamsDialog: initialView: ", this.theEnvironment.initialView);
#endif

   var labelWidth = this.font.width( "MMMMMMMMMMMMMM" ) ;
   var emWidth = this.font.width( 'M' );
   var editWidth = 40*emWidth;
   var editHeight = 8*this.font.lineSpacing;

   var sourceView = theDialog.theParameters.sourceView;

   // -- HelpLabel
   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = VP_ABOUT_TEXT;



   // -- Show selected view
   this.view_Label = new Label( this );
   this.view_Label.text = "Current view:";
   this.view_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.view_Label.setFixedWidth(labelWidth);

   this.view_Name = new Label( this );
   if ( sourceView == null) {
      this.view_Name.text = "<none>";
   } else {
      var viewMaskIndicator = "";
      if (sourceView.window.maskEnabled && !sourceView.window.mask.isNull) {
         viewMaskIndicator = " (MASKED)";
      }
      this.view_Name.text = sourceView.fullId + viewMaskIndicator;
   }

   this.view_Sizer = new HorizontalSizer;
   this.view_Sizer.spacing = 4;
   this.view_Sizer.add( this.view_Label );
   this.view_Sizer.add( this.view_Name, 100 );


   // -- Selection of process
   this.process_Label = new Label( this );
   this.process_Label.text = "Process to execute:";
   this.process_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.process_Label.setFixedWidth(labelWidth);


   this.process_ComboxBox = new ComboBox(this);
   var processIcons = vP_makeListOfPotentialProcessIcons(sourceView);
   for (var i = 0; i<processIcons.length; i++) {
      var processIconAndType = processIcons[i] + " (" + ProcessInstance.fromIcon(processIcons[i]).processId()+ ")";
      this.process_ComboxBox.addItem(processIconAndType);
   }
   this.process_ComboxBox.currentItem =-1;


   this.process_ComboxBox.toolTip= PROCESS_ICONS_TOOLTIP ;
   this.process_ComboxBox.onItemSelected = function(index) {
      var processName = processIcons[index];
#ifdef DEBUG
      Console.writeln("onItemSelected: selected process icon: " , processName);
#endif
      theDialog.theParameters.processInstanceName = processName;
      var selectedProcessInstance = ProcessInstance.fromIcon(processName);
      theDialog.initParameterList();
      // If process type did change, the parameter to vary must be reinitialized
      var selectedProcessType = selectedProcessInstance.processId();
      if (selectedProcessType !== theDialog.theParameters.processType) {
         theDialog.theParameters.processType = selectedProcessType;
         theDialog.theParameters.parameterToVary = "";
         theDialog.theParameters.parameterValuesText = "";
      }
      theDialog.initParameterValue();
      theDialog.initExecuteMode();
   }

   this.process_Sizer = new HorizontalSizer;
   this.process_Sizer.spacing = 4;
   this.process_Sizer.add( this.process_Label );
   this.process_Sizer.add( this.process_ComboxBox, 100 );


   // -- Selection of process mode
   this.processMode_Label = new Label( this );
   this.processMode_Label.text = "Type of process:";
   this.processMode_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.processMode_Label.setFixedWidth(labelWidth);

   this.processMode_ComboxBox = new ComboBox(this);

   // Will be filled dynamically
   this.processMode_ComboxBox.currentItem=-1;
   this.processMode_ComboxBox.toolTip= DEFAULT_COMBOX_TOOLTIP ;
   this.processMode_ComboxBox.onItemSelected = function(index) {
#ifdef DEBUG
      Console.writeln("onItemSelected: selected process mode: " , index);
#endif
      if (index >= 0) {
         theDialog.theParameters.operateOn=theDialog.theParameters.processModeChoice[index];
      } else {
         theDialog.theParameters.operateOn=VP_OPERATE_UNDEFINED;
      }
   };

   this.processMode_Sizer = new HorizontalSizer;
   this.processMode_Sizer.spacing = 4;
   this.processMode_Sizer.add( this.processMode_Label );
   this.processMode_Sizer.add( this.processMode_ComboxBox, 100 );


   // -- Selection of parameter to vary
   this.parameters_Label = new Label( this );
   this.parameters_Label.text = "Parameter to vary:";
   this.parameters_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.parameters_Label.setFixedWidth(labelWidth);

   this.parameters_ComboxBox = new ComboBox(this);
   this.parameters_ComboxBox.toolTip= "Select the parameter that you want to change at each execution.<br/>" +
                                 "Do not use parameters that changes the type of the process as specified in the selection above.";
   this.parameters_ComboxBox.onItemSelected = function(index) {
     // TODO Keep track of list
      theDialog.theParameters.parameterToVary = theDialog.theParameters.listOfParameterNames[index];

      theDialog.values_TextBox.text = JSON.stringify(theDialog.theParameters.listOfParameterOriginalValues[index]);
#ifdef DEBUG
      Console.writeln("onItemSelected: selected parameter: " , theDialog.theParameters.parameterToVary);
#endif
   }

   this.parameters_Sizer = new HorizontalSizer;
   this.parameters_Sizer.spacing = 4;
   this.parameters_Sizer.add( this.parameters_Label );
   this.parameters_Sizer.add( this.parameters_ComboxBox, 100 );

   // -- Enter list of values for the parameter
   this.values_Label = new Label(this);
   this.values_Label.text = "List of values:"
   this.values_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.values_Label.setFixedWidth(labelWidth);

   this.values_TextBox = new TextBox( this );
   this.values_TextBox.text = "";
   this.values_TextBox.toolTip = "Enter a list of a values (in JSon format (http://www.json.org/), of the proper type, " +
                            "without the external brackets<br/>" +
                            "For example: '0.5,0.75,1'";

//   values_TextBox.setScaledMinSize(300,50);
//   values_TextBox.setScaledFixedHeight(50);
   //values_TextBox.setScaledMinSize(300,50);
   this.values_TextBox.setMinWidth(editWidth);
   this.values_TextBox.setFixedHeight(editHeight);

   this.values_Sizer = new HorizontalSizer;
   this.values_Sizer.margin = 4;
   this.values_Sizer.spacing = 6;
   this.values_Sizer.add(this.values_Label);
   this.values_Sizer.add(this.values_TextBox);


   // -- Select the processing of the result
   this.outputType_Label = new Label( this );
   this.outputType_Label.text = "Type of output:";
   this.outputType_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.outputType_Label.setFixedWidth(labelWidth);

   this.outputType_ComboxBox = new ComboBox(this);
   // TODO only previiw if has a source view
   this.outputType_ComboxBox.addItem("Keep resulting view on workspace");
   this.outputType_ComboxBox.addItem("Save resulting view to file and close");
   this.outputType_ComboxBox.addItem("Keep resulting view as preview");

   this.outputType_ComboxBox.currentItem=-1;
   this.outputType_ComboxBox.toolTip= "Select how the result will be saved. This must be consistent with the way the process works." +
            "<br/><em>Keep resulting view on workspace</em> will copy the view with the mask (if required), apply the process and leave the view on the workspace." +
            "<br/><em>Save resulting view to file and close</em> will copy the view with the mask (if required), apply the process, save the " +
            "resulting window to a new file and close it. This is useful with Blink." +
            "<br/><em>Keep resulting view as preview</em> works only on processes that update the source image, it will create a preview " +
            "of the full image or a copy of the current preview (if a preview is selected) and apply the process ot it.";
   this.outputType_ComboxBox.onItemSelected = function(index) {
#ifdef DEBUG
      Console.writeln("onItemSelected: selected output type: " , index);
#endif
      theDialog.theParameters.resultDestination = theDialog.theParameters.resultDestinationChoice[index];
      theDialog.initDestination();
   };

   this.outputType_Sizer = new HorizontalSizer;
   this.outputType_Sizer.spacing = 4;
   this.outputType_Sizer.add( this.outputType_Label );
   this.outputType_Sizer.add( this.outputType_ComboxBox, 100 );

   // -- Select the output directory if required
   this.opd_Label = new Label(this);
   this.opd_Label.text= "Image Output Dir: ";
   this.opd_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.opd_Label.setFixedWidth(labelWidth);

   this.opd_Edit = new Edit(this);
   this.opd_Edit.text= guiParameters.outputDirectory;
   this.opd_Edit.readOnly = true;
   this.opd_Edit.style = FrameStyle_Box;
   this.opd_Edit.setFixedWidth(editWidth);
   this.opd_Edit.toolTip = "Image output directory.";

   this.opd_EditButton = new ToolButton(this);
   this.opd_EditButton.icon = this.scaledResource( ":/file-explorer/open.png" );
   this.opd_EditButton.toolTip = "Select the image output directory.";
   this.opd_EditButton.onClick = function() {
         var gdd = new GetDirectoryDialog;
         gdd.caption = "Select Output Directory: ";
         gdd.initialPath = theDialog.theParameters.outputDirectory;

         if ( gdd.execute() ) {
            var dir = gdd.directory;
            if(dir.charAt(dir.length-1) != '/')
               dir += "/";
#ifdef DEBUG
            Console.writeln("onClick: Selected directory: ", dir);
#endif
            theDialog.theParameters.outputDirectory = dir;
            this.dialog.opd_Edit.text = dir;
         }
      };
   this.opd_EditButton.enabled = false;

   this.opd_Sizer = new HorizontalSizer;
   this.opd_Sizer.margin = 4;
   this.opd_Sizer.spacing = 6;
   //this.opd_Sizer.addStretch();
   this.opd_Sizer.add(this.opd_Label);
   this.opd_Sizer.add(this.opd_Edit);
   this.opd_Sizer.add(this.opd_EditButton);

   // -- Select the deletion of other previews
   this.deletePreviews_Label = new Label(this);
   this.deletePreviews_Label.text= "Delete other previews: ";
   this.deletePreviews_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.deletePreviews_Label.setFixedWidth(emWidth*20);
   this.deletePreviews_CheckBox = new CheckBox(this);
   this.deletePreviews_CheckBox.checked = this.theParameters.deleteOtherPreviews;
   this.deletePreviews_CheckBox.enabled = false;
   this.deletePreviews_CheckBox.toolTip = "Check to delete all previews of source window (except the preview used as source).";

   this.overWriteFiles_Label = new Label(this);
   this.overWriteFiles_Label.text= "Overwrite output files: ";
   this.overWriteFiles_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.overWriteFiles_Label.setFixedWidth(emWidth*20);
   this.overWriteFiles_CheckBox = new CheckBox(this);
   this.overWriteFiles_CheckBox.checked = this.theParameters.overwriteOutputFiles;
   this.overWriteFiles_CheckBox.enabled = false;
   this.overWriteFiles_CheckBox.toolTip = "Check to allow silent overwrite of generated files.";


   this.deletePreviews_Sizer = new HorizontalSizer;
   this.deletePreviews_Sizer.margin = 4;
   this.deletePreviews_Sizer.spacing = 6;
   this.deletePreviews_Sizer.add(this.deletePreviews_Label);
   this.deletePreviews_Sizer.add(this.deletePreviews_CheckBox);
   this.deletePreviews_Sizer.add(this.overWriteFiles_Label);
   this.deletePreviews_Sizer.add(this.overWriteFiles_CheckBox);

   // -- OK / Cancel buttons
   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function() {
         this.dialog.cancel();
      };

   this.helpDialog = new HelpDialog(this);

   this.help_Button = new PushButton( this );
   this.help_Button.text = "Help";
   this.help_Button.icon = this.scaledResource( ":/icons/help.png" );
   this.help_Button.onClick = function() {
      this.dialog.helpDialog.execute();
      };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add( this.help_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   // Assemble dialog
   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.view_Sizer);
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.process_Sizer );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.processMode_Sizer);
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.parameters_Sizer );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.values_Sizer);
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.outputType_Sizer);
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.opd_Sizer);
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.deletePreviews_Sizer);
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();



// --------------------------------------------------------------------------------------------------------
// Helper methods to initialize some fields at creation or after some modifications
// --------------------------------------------------------------------------------------------------------

   // -- Helper method to inialize the list of allowed execution modes
   this.initExecuteMode = function() {
      // Fill operateOn deepending on process and view
      var theProcessInstance = null;
      if (! vP_isBlank(this.theParameters.processInstanceName)) {
         theProcessInstance = ProcessInstance.fromIcon(this.theParameters.processInstanceName);
      }
      var operateOnList = [];
      this.processMode_ComboxBox.clear();

      if (theProcessInstance != null) {
         operateOnList = this.theEnvironment.getOperateOnList(theProcessInstance, theDialog.theParameters.sourceView);

         // Populate combox (normally a single choice)
         for (var indexOperateOnList = 0; indexOperateOnList<operateOnList.length; indexOperateOnList++ ) {
            var curOperateOn = operateOnList[indexOperateOnList];
            switch (curOperateOn) {
               case VP_OPERATE_MODIFYING_SOURCE:
                  this.processMode_ComboxBox.addItem("Update source image");
                break;
              case VP_OPERATE_PROCESS_GENERATING_NEW_WINDOW:
                  this.processMode_ComboxBox.addItem("Generate new image");
                break;
              case VP_OPERATE_GLOBALLY:
                  this.processMode_ComboxBox.addItem("Execute globally");
                break;

            }
            this.theParameters.processModeChoice.push(curOperateOn);

         }
         if (operateOnList.length===0) {
            // No operation valid
            // SHOW DIALOG
         } else if (operateOnList.length===1) {
            // There is a single operation, show it
            this.processMode_ComboxBox.currentItem=0;
            this.theParameters.operateOn = operateOnList[0];
            this.processMode_ComboxBox.enabled = false;
            switch (operateOnList[0]) {
               case VP_OPERATE_MODIFYING_SOURCE:
                  this.processMode_ComboxBox.toolTip = "The process updates the source image.  <br/>VaryParams will work on a copy. ";
                break;
              case VP_OPERATE_PROCESS_GENERATING_NEW_WINDOW:
                  this.processMode_ComboxBox.toolTip = "The process generates a new image. ";
                break;
              case VP_OPERATE_GLOBALLY:
                  this.processMode_ComboxBox.toolTip = "The process executes globally.  <br/>No source image will be used. ";
                break;

            }
         } else {
            // Multiple operations possible
            this.processMode_ComboxBox.currentItem=0;
            this.theParameters.operateOn = VP_OPERATE_UNDEFINED;
            this.processMode_ComboxBox.enabled = true;
            this.processMode_ComboxBox.toolTip= DEFAULT_COMBOX_TOOLTIP ;
         }
      }

   };


    // -- Helper method to initialize the list of parameter names (updated when process changes)
   this.initParameterList = function() {
      this.parameters_ComboxBox.clear()
      var parameters = vP_getListOfParameters(theDialog.theParameters.processInstanceName)
      parameters = parameters.sort(function(p1, p2){return p1[0]>p2[0]});
      var paramNames = parameters.map(function(p){return p[0]})
      this.theParameters.listOfParameterNames = paramNames;
      this.theParameters.listOfParameterOriginalValues =  parameters.map(function(p){return p[1]});
      for (var i = 0; i<parameters.length; i++) {
         this.parameters_ComboxBox.addItem(parameters[i][0] + "  (" + typeof (parameters[i][1]) + " " + parameters[i][1] +")");
      }
      this.parameters_ComboxBox.currentItem = -1;
      // No current value
      theDialog.values_TextBox.text = "";
   };


   // Initialize the parameter choice and value
   this.initParameterValue = function() {
      // if blank, will be -1
      var indexOfParameterToVary = this.theParameters.listOfParameterNames.indexOf(this.theParameters.parameterToVary);
#ifdef DEBUG
      Console.writeln("initParameterValue: parameter: '", this.theParameters.parameterToVary, "' has index: ", indexOfParameterToVary);
#endif
      this.parameters_ComboxBox.currentItem = indexOfParameterToVary;
      if (indexOfParameterToVary === -1) {
         this.theParameters.parameterValuesText = "";
      } else {
         this.values_TextBox.text = this.theParameters.parameterValuesText;
      };
   }


   this.initDestination = function() {
      this.outputType_ComboxBox.currentItem = this.theParameters.resultDestinationChoice.indexOf(this.theParameters.resultDestination);

      switch (this.theParameters.resultDestination) {
      case VP_RESULT_IN_WINDOWS:
         this.opd_EditButton.enabled = false;
         this.deletePreviews_CheckBox.enabled = false;
         this.overWriteFiles_CheckBox.enabled = false;
         break;
      case VP_RESULT_IN_FILES:
         this.opd_EditButton.enabled = true;
         this.overWriteFiles_CheckBox.enabled = true;
         this.deletePreviews_CheckBox.enabled = false;
         break;
      case VP_RESULT_IN_PREVIEWS:
         this.opd_EditButton.enabled = false;
         this.overWriteFiles_CheckBox.enabled = false;
         this.deletePreviews_CheckBox.enabled = true;
         break;
      default:
         this.theParameters.resultDestination = VP_RESULT_UNDEFINED;
         this.opd_EditButton.enabled = false;
         this.overWriteFiles_CheckBox.enabled = false;
         this.deletePreviews_CheckBox.enabled = false;
      }

   };


   // Helper methods to initialize the gui from the guiParameters read from settings
   this.initialize = function () {
      // Will be -1 if process instance name is not present (loaded from settings but not in current workspace)
      var processInstanceIndex = processIcons.indexOf( this.theParameters.processInstanceName);
      if (processInstanceIndex >= 0) {
         // We have a process with the same name in the current project, check the type
         var pInstance = ProcessInstance.fromIcon(this.theParameters.processInstanceName);
         var pType = pInstance.processId();
         if (pType !== this.theParameters.processType) {
            // The process is not of the same type, it was a name collision, consider it undefined
#ifdef DEBUG
            Console.writeln("initialize: process '", this.theParameters.processInstanceName, "' of type '", this.theParameters.processType,
               "' does not have expected type '", this.theParameters.processType, "', consider uninitialiezd" );
#endif
            processInstanceIndex = -1;
            this.theParameters.processInstanceName = "";
            this.theParameters.processType = "";
         }
      }

      if (processInstanceIndex === -1) {
          // No valid process in the settings, all process depending parameters are unitialized
          this.process_ComboxBox.currentItem = -1;
#ifdef DEBUG
         Console.writeln("initialize: process ", this.theParameters.processInstanceName, " not found, depending parameters marked unitialized");
#endif
         this.theParameters.processInstanceName = "";
         this.theParameters.processType = "";
         this.theParameters.parameterToVary = "";
         this.theParameters.parameterValuesText = "";
         this.theParameters.operateOn = VP_OPERATE_UNDEFINED;

      } else {
         // There was a valid process in the settings, select it as default
          this.process_ComboxBox.currentItem = processInstanceIndex;
#ifdef DEBUG
         Console.writeln("initialize: process ", this.theParameters.processInstanceName, " found, load depending parameters");
#endif
         // If the process is found, initialize all subsequent parameters

         this.initExecuteMode();
         this.initParameterList();
         this.initParameterValue();
         this.initDestination();
      }
      if (! File.directoryExists(this.theParameters.outputDirectory)) {
         this.theParameters.outputDirectory = File.systemTempDirectory;
      }
   };




   // -- Helper method to fill the GUI parameters with the values that were not filled by callbacks
   this.completeParameters = function () {
      // Get values from text box
      this.theParameters.parameterValuesText = this.values_TextBox.text;
      this.theParameters.deleteOtherPreviews = this.deletePreviews_CheckBox.checked;
      this.theParameters.overwriteOutputFiles = this.overWriteFiles_CheckBox.checked;
   }

// -- Initialization of dialog

   this.initialize();


// --------------------------------------------------------------------------------------------------------
// Entry point in the dialoy
// --------------------------------------------------------------------------------------------------------


   // -- Execute the dialog and fill the results in the GUI parameters
   this.executeAndComplete = function() {
      var result =this.execute();
#ifdef DEBUG
      Console.writeln("Vp_VaryParamsDialog: executeAndComplete: result: ", result);
#endif
      if (result) {
         this.completeParameters();
#ifdef DEBUG
         Console.writeln("VaryParamDialog: executeAndComplete: completed, " + this.theParameters.toString());
#endif
      }
      return result;
   }

#ifdef DEBUG
   Console.writeln("VaryParamDialog built, " + this.theParameters.toString());
#endif
}
// Our dialog inherits all properties and methods from the core Dialog object.
Vp_VaryParamsDialog.prototype = new Dialog;

// ****************************************************************************
// EOF VaryParams-gui.jsh - Released 2013/12/03 16:15:08 UTC
