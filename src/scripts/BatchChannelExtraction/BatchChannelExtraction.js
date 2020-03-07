/*
                              Batch Channel Extraction Script

   A script for automating the channel extraction of RGB image files.

   Copyright (C) 2010-2017 S J Brown
   Contributions: Copyright (C) 2017 Michael Covington

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
/* beautify ignore:start */
#feature-id    Batch Processing > BatchChannelExtraction

#feature-info  An automated channel extraction utility.<br/>\
   <br/>\
   A script designed to extract the color channels from RGB images and save \
   them to selected directories.<br/>\
   <br/>\
   Copyright &copy; 2010-2017 S J Brown<br/>\
   Contributions:<br/>\
   Copyright &copy; 2017 Michael Covington<br/>\
   Copyright &copy; 2019 Roberto Sartori

#feature-icon  BatchChannelExtraction.xpm

#include <pjsr/NumericControl.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/Color.jsh>
#include <pjsr/SectionBar.jsh>

#define VERSION "2.0.0"
#define TITLE   "Batch Channel Extraction"

#define DEFAULT_EXTENSION     ".xisf"

/* beautify ignore:end */

// string arrays
var btnText = new Array(
   "Add Files", // 0
   "Close", // 1
   "Clear", // 2
   "Delete Selected", // 3
   "Execute", // 4
   "Invert Selection", // 5
   "OK", // 6
   "Remove Selected", // 7
   "Select", // 8
   "Select All", // 9
   "Enter", //10
   "Add Img Set", //11
   "Move Up", //12
   "Move Down", //13
   "Calibrate", //14
   "DeBayer", //15
   "Register", //16
   "Crop", //17
   "Integrate", //18
   "Set Parameters", //19
   "Edit", //20
   "Edit Value", //21
   "Toggle", //22
   "Toggle Up", //23
   "Toggle Down", //24
   "Selection", //25
   "Selection Up", //26
   "Selection Down", //27
   "Set True", //28
   "Set False", //29
   "Accept", //30
   "Verify Paths" ); //

var btnIcon = new Array(
   ":/icons/arrow-up.png", // 0
   ":/icons/arrow-down.png", // 1
   ":/icons/arrow-left.png", // 2
   ":/icons/arrow-right.png", // 3
   ":/browser/select.png", // 4
   ":/process-interface/expand.png", // 5
   ":/process-interface/expand_vert.png", // 6
   ":/process-interface/contract.png", // 7
   ":/process-interface/contract_vert.png", // 8
   ":/bullets/bullet-blue.png", // 9
   ":/bullets/bullet-green.png", //10
   ":/bullets/bullet-grey.png", //11
   ":/bullets/bullet-red.png", //12
   ":/bullets/bullet-yellow.png", //13
   ":/auto-hide/close.png", //14
   ":/" );

// Add FITS information if not exists, otherwise update information.
function updateKeyword( keywords, name, value, comment )
{
   for ( var i = 0; i < keywords.length; i++ )
   {
      if ( keywords[ i ].name == name )
      {
         keywords[ i ].value = value;
         if ( comment != null )
            keywords[ i ].comment = comment;
         return;
      }
   }
   keywords.push( new FITSKeyword( name, value, ( comment == null ) ? "" : comment ) );
}

// label object constructor
function labelBox( parent, elText, tAlign, elWidth )
{
   this.label = new Label( parent );
   this.label.text = elText;
   this.label.useRichText = true;
   this.label.textAlignment = tAlign;
   this.label.setMaxWidth( elWidth );

   return this.label;
}

// push button object constructor
function pushButton( parent, bText, bIcon, bToolTip )
{
   this.button = new PushButton( parent );
   if ( bText != '' )
      this.button.text = bText;
   if ( bIcon != '' )
      this.button.icon = this.button.scaledResource( bIcon );
   if ( bToolTip != '' )
      this.button.toolTip = bToolTip;

   return this.button;
}

// tool button object constructor
function toolButton( parent, tbIcon, tbToolTip )
{
   this.toolButton = new ToolButton( parent );
   if ( tbIcon != '' )
      this.toolButton.icon = this.toolButton.scaledResource( tbIcon );
   if ( tbToolTip != '' )
      this.toolButton.toolTip = tbToolTip;

   return this.toolButton;
}

// radio button object constructor
function radioButton( parent, rbText, rbChecked, rbToolTip )
{
   this.radioButton = new RadioButton( parent );
   this.radioButton.text = rbText;
   this.radioButton.checked = rbChecked;
   if ( rbToolTip.length != 0 )
      this.radioButton.toolTip = rbToolTip;

   return this.radioButton;
}

// checkbox object constructor
function checkBox( parent, cbText, cbChecked, cbToolTip )
{
   this.checkbox = new CheckBox( parent );
   this.checkbox.text = cbText;
   this.checkbox.checked = cbChecked;
   if ( cbToolTip.length != 0 )
      this.checkbox.toolTip = cbToolTip;

   return this.checkbox;
}

// edit box object constructor
function editBox( parent, eText, readWrite, eStyle, eMinWidth )
{
   this.edit = new Edit( parent );
   if ( eText != '' )
      this.edit.text = eText;
   this.edit.readOnly = readWrite;
   this.edit.style = eStyle;
   this.edit.setMinWidth( eMinWidth );

   return this.edit;
}

// spin box object constructor
function spinBox( parent, sbValue, sbMinVal, sbMaxVal, sbStep, sbCanEdit )
{
   this.spinbox = new SpinBox( parent );
   this.spinbox.value = sbValue;
   this.spinbox.setRange( sbMinVal, sbMaxVal );
   this.spinbox.stepSize = sbStep;
   this.spinbox.editable = sbCanEdit;

   return this.spinbox;
}

// numeric control object constructor
function numericControl( parent, ncVal, ncPrec, ncLow, ncHigh, slLow, slHigh, minW, lText, tTip )
{
   this.nc = new NumericControl( parent );
   this.nc.setValue( ncVal );
   this.nc.setPrecision( ncPrec );
   this.nc.setRange( ncLow, ncHigh );
   this.nc.slider.setRange( slLow, slHigh );
   this.nc.slider.scaledMinWidth = minW;
   if ( lText.length != 0 )
      this.nc.label.text = lText;
   if ( tTip.length != 0 )
      this.nc.toolTip = tTip;

   return this.nc;
}

var channels = [
{
   label: "RGB --> R",
   colorSpace: ChannelExtraction.prototype.RGB,
   defaultPostfix: "_RGB_R",
   defaultPrefix: "RGB_R_",
},
{
   label: "RGB --> G",
   colorSpace: ChannelExtraction.prototype.RGB,
   defaultPostfix: "_RGB_G",
   defaultPrefix: "RGB_G_",
},
{
   label: "RGB --> B",
   colorSpace: ChannelExtraction.prototype.RGB,
   defaultPostfix: "_RGB_B",
   defaultPrefix: "RGB_B_",
},
{
   label: "HSV --> H",
   colorSpace: ChannelExtraction.prototype.HSV,
   defaultPostfix: "_HSV_H",
   defaultPrefix: "HSV_H_",
},
{
   label: "HSV --> S",
   colorSpace: ChannelExtraction.prototype.HSV,
   defaultPostfix: "_HSV_S",
   defaultPrefix: "HSV_S_",
},
{
   label: "HSV --> V",
   colorSpace: ChannelExtraction.prototype.HSV,
   defaultPostfix: "_HSV_V",
   defaultPrefix: "HSV_V_",
},
{
   label: "HSI --> H",
   colorSpace: ChannelExtraction.prototype.HSI,
   defaultPostfix: "_HSI_H",
   defaultPrefix: "HSI_H_",
},
{
   label: "HSI --> S",
   colorSpace: ChannelExtraction.prototype.HSI,
   defaultPostfix: "_HSI_S",
   defaultPrefix: "HSI_S_",
},
{
   label: "HSI --> I",
   colorSpace: ChannelExtraction.prototype.HSI,
   defaultPostfix: "_HSI_I",
   defaultPrefix: "HSI_I_",
},
{
   label: "CIE XYZ --> X",
   colorSpace: ChannelExtraction.prototype.CIEXYZ,
   defaultPostfix: "_CIEXYZ_X",
   defaultPrefix: "CIEXYZ_X_",
},
{
   label: "CIE XYZ --> Y",
   colorSpace: ChannelExtraction.prototype.CIEXYZ,
   defaultPostfix: "_CIEXYZ_Y",
   defaultPrefix: "CIEXYZ_Y_",
},
{
   label: "CIE XYZ --> Z",
   colorSpace: ChannelExtraction.prototype.CIEXYZ,
   defaultPostfix: "_CIEXYZ_Z",
   defaultPrefix: "CIEXYZ_Z_",
},
{
   label: "CIE Lab --> L",
   colorSpace: ChannelExtraction.prototype.CIELab,
   defaultPostfix: "_CIELab_L",
   defaultPrefix: "CIELab_L_",
},
{
   label: "CIE Lab --> a",
   colorSpace: ChannelExtraction.prototype.CIELab,
   defaultPostfix: "_CIELab_a",
   defaultPrefix: "CIELab_a_",
},
{
   label: "CIE Lab --> b",
   colorSpace: ChannelExtraction.prototype.CIELab,
   defaultPostfix: "_CIELab_b",
   defaultPrefix: "CIELab_b_",
},
{
   label: "CIE Lch --> L",
   colorSpace: ChannelExtraction.prototype.CIELch,
   defaultPostfix: "_CIELch_L",
   defaultPrefix: "CIELch_L_",
},
{
   label: "CIE Lch --> c",
   colorSpace: ChannelExtraction.prototype.CIELch,
   defaultPostfix: "_CIELch_c",
   defaultPrefix: "CIELch_c_",
},
{
   label: "CIE Lch --> h",
   colorSpace: ChannelExtraction.prototype.CIELch,
   defaultPostfix: "_CIELch_h",
   defaultPrefix: "CIELch_h_",
}, ]

function ChannelData( index )
{
   return {
      postfix: channels[ index ].defaultPostfix,
      prefix: channels[ index ].defaultPrefix,
      outputDir: "",
      index: index,
      enabled: true,
   }
}

function GlobalData()
{
   this.inputFiles = new Array;
   this.ipCount = 0;
   this.clearConsole = false;
   this.opfExt = DEFAULT_EXTENSION;
   this.sampleFormat = ChannelExtraction.prototype.SameAsSource;
   this.writeChannelFilter = true;
   this.channelFilterKeyword = "FILTER";
   this.channels = [];
}

var data = new GlobalData(); // variable for global access to script data

var sampFrmt = [
   "Same As Source",
   "8-bit unsigned integer (byte, 0 -> 255)",
   "16-bit unsigned integer (word, 0 -> 65535)",
   "32-bit unsigned integer (double word, 0 -> 4G)",
   "32-bit IEEE 754 floating point (single precision)",
   "64-bit IEEE 754 floating point (double precision)",
];

// script engine
function ChannelExtractionEngine()
{
   this.execute = function()
   {
      var errors = 0;
      var T = new ElapsedTime;

      if ( data.clearConsole )
         console.clear();

      console.writeln( "<end><cbr><br>"
                     + "*************************************" );
      console.writeln( "***** Channel Extraction Engine *****" );
      console.writeln( "*************************************" );
      console.writeln( "<br>\tProcessing ", data.ipCount, " image files..." );

      for ( var i = 0, n = data.ipCount; i < n; ++i )
      {
         console.noteln( "<br>File #", ( i + 1 ) );

         // check that the file exists
         if ( !File.exists( data.inputFiles[ i ] ) )
         {
            ++errors;
            console.writeln( "<br>Failed to locate :" );
            console.writeln( File.extractName( data.inputFiles[ i ] ) );
            continue;
         }

         // try to open the file
         var srcWin = ImageWindow.open( data.inputFiles[ i ] );
         if ( srcWin.isNull )
         {
            ++errors;
            console.writeln( "<br>Failed to open :" );
            console.writeln( File.extractName( data.inputFiles[ i ] ) );
            continue;
         }

         // check that the image is RGB, continue if not
         if ( !srcWin[ 0 ].mainView.image.isColor )
         {
            ++errors;
            var str = File.extractName( data.inputFiles[ i ] ) + "<br>is not an RGB image";
            console.writeln( "<br>", str );
            srcWin[ 0 ].forceClose();
            continue;
         }

         // store target image properties
         var bps;
         var fs;
         if ( data.forceSampleFormat )
         {
            bps = data.bitsPerSample;
            fs = data.floatSample;
         }
         else
         {
            bps = srcWin[ 0 ].bitsPerSample;
            fs = srcWin[ 0 ].isFloatSample
         }

         // extract channels
         for ( var iChannel = 0; iChannel < data.channels.length; ++iChannel )
         {
            // skip disabled channels
            if ( !data.channels[ iChannel ].enabled )
            {
               continue;
            }
            let channelData = data.channels[ iChannel ];
            let channelTemplate = channels[ channelData.index ];

            console.noteln( 'Extracting channel ', channelTemplate.label );
            var P = new ChannelExtraction;
            P.colorSpace = channelTemplate.colorSpace;
            P.channels = [ // enabled, id
               [ data.channels[ iChannel ].index % 3 == 0, "_CHANNEL" ],
               [ data.channels[ iChannel ].index % 3 == 1, "_CHANNEL" ],
               [ data.channels[ iChannel ].index % 3 == 2, "_CHANNEL" ]
            ];
            P.sampleFormat = ChannelExtraction.prototype.SameAsSource;
            P.executeOn( srcWin[ 0 ].mainView );

            let destWin = ImageWindow.windowById( "_CHANNEL" );
            if ( !destWin || destWin.isNull )
            {
               ++errors;
               var str = File.extractName( "Failed to extract channel " + channelTemplate.label + " from " + data.inputFiles[ i ] );
               console.writeln( "<br>", str );
               srcWin[ 0 ].forceClose();
               continue;
            }

            // update the keywords if needed
            if ( data.writeChannelFilter )
            {
               var keywords = srcWin[ 0 ].keywords;
               updateKeyword( keywords, "FILTER", channelTemplate.label, "BatchChannelExtraction channel name" );
               destWin.keywords = keywords;
            }

            // build the output file paths
            var drv = "";
            var dir = "";
            var ext = data.opfExt;
            var prefix = channelData.prefix;
            var postfix = channelData.postfix;
            var name = "";
            var path = "";

            if ( channelData.outputDir.length == 0 )
            {
               drv = File.extractDrive( data.inputFiles[ i ] );
               dir = drv + File.extractDirectory( data.inputFiles[ i ] );
            }
            else
               dir = channelData.outputDir;
            if ( dir.charAt( dir.length - 1 ) != '/' )
               dir += "/";
            name = File.extractName( data.inputFiles[ i ] );
            path = dir + prefix + name + postfix + ext;

            destWin.saveAs( path, false, false, false, false );
            destWin.forceClose();
         }

         srcWin[ 0 ].forceClose();
      }

      console.writeln( "<end><cbr><br>Channel extraction complete: ", ( data.ipCount - errors ), " succeeded, ", errors, " failed" );
      console.writeln( "Process time: ", T.text );
   }
}
var engine = new ChannelExtractionEngine();

//////////// Main Dialog %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function mainDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var ttStr = "";

   this.OPD_Labels = [];
   this.OPD_Edits = [];
   this.OPDEdit_Buttons = [];
   this.OPD_Sizers = [];
   this.defaultOPFPrefix_Buttons = [];
   this.defaultOPFPostfix_Buttons = [];
   this.removeChannel_Buttons = [];
   this.removeChannel_Sizers = [];
   this.OPFPostfix_Edits = [];
   this.OPFPrefix_Edits = [];
   this.OPFPrefix_Labels = [];
   this.OPFPrefix_Edits = [];
   this.OPFPostfix_Labels = [];
   this.OPFPostfix_Edits = [];
   this.OPFPP_Sizers = [];
   this.Output_GroupBoxes = [];
   this.sectionBars = [];

   // BUILD THE CONTROLS FOR EACH CHANNEL
   this.buildGroupForChannelAtIndex = ( i ) =>
   {
      // -------------------------
      // output directory control
      // -------------------------
      let channelTemplate = channels[ data.channels[ i ].index ];
      this.OPD_Labels[ i ] = new labelBox( this, "Output Dir:", TextAlign_VertCenter, 100 );
      ttStr = "Channel output directory.";
      this.OPD_Edits[ i ] = new editBox( this, "", true, FrameStyle_Box, 514 );
      this.OPD_Edits[ i ].text = data.channels[ i ].outputDir;
      this.OPD_Edits[ i ].toolTip = ttStr;
      ttStr = "Select the channel output directory.<br>" +
         "If none is selected output will be placed in the " +
         "input file directory.";
      this.OPDEdit_Buttons[ i ] = new toolButton( this, btnIcon[ 4 ], ttStr );
      this.OPDEdit_Buttons[ i ].onClick = function()
      {
         var gdd = new GetDirectoryDialog;
         gdd.caption = "Select Channel Output Directory";
         gdd.initialPath = data.channels[ i ].outputDir;

         if ( gdd.execute() )
         {
            var dir = gdd.directory;
            if ( dir.charAt( dir.length - 1 ) != '/' )
               dir += "/";
            data.channels[ i ].outputDir = dir;
            this.dialog.OPD_Edits[ i ].text = dir;
         }
      }

      this.OPD_Sizers[ i ] = new HorizontalSizer;
      with( this.OPD_Sizers[ i ] )
      {
         margin = 0;
         spacing = 6;
         add( this.OPD_Labels[ i ] );
         add( this.OPD_Edits[ i ] );
         add( this.OPDEdit_Buttons[ i ] );
      }

      // -------------------------
      // prefix input and button
      // -------------------------
      this.OPFPrefix_Labels[ i ] = new labelBox( this, "Prefix:", TextAlign_VertCenter, 120 );
      this.OPFPrefix_Edits[ i ] = new editBox( this, "", false, FrameStyle_Box, 50 );
      this.OPFPrefix_Edits[ i ].setScaledFixedWidth( 80 );
      ttStr = "Output file prefix."
      this.OPFPrefix_Edits[ i ].toolTip = ttStr;
      this.OPFPrefix_Edits[ i ].onTextUpdated = function( text )
      {
         data.channels[ i ].prefix = text;
      }

      ttStr = "Select the default channel output file prefix.";
      this.defaultOPFPrefix_Buttons[ i ] = new pushButton( this, "Default Prefix", "", ttStr );
      this.defaultOPFPrefix_Buttons[ i ].onClick = function()
      {
         data.channels[ i ].prefix = channelTemplate.defaultPrefix;
         this.dialog.OPFPrefix_Edits[ i ].text = data.channels[ i ].prefix;
         data.channels[ i ].postfix = "";
         this.dialog.OPFPostfix_Edits[ i ].text = data.channels[ i ].postfix;
      }

      // -------------------------
      // postfix input and button
      // -------------------------
      ttStr = "Select the default output file postfix.";
      this.defaultOPFPostfix_Buttons[ i ] = new pushButton( this, "Default Postfix", "", ttStr );
      this.defaultOPFPostfix_Buttons[ i ].onClick = function()
      {
         data.channels[ i ].prefix = "";
         this.dialog.OPFPrefix_Edits[ i ].text = data.channels[ i ].prefix;
         data.channels[ i ].postfix = channelTemplate.defaultPostfix;
         this.dialog.OPFPostfix_Edits[ i ].text = data.channels[ i ].postfix;
      }

      this.OPFPostfix_Labels[ i ] = new labelBox( this, "Postfix:", TextAlign_VertCenter, 120 );
      this.OPFPostfix_Edits[ i ] = new editBox( this, "", false, FrameStyle_Box, 50 );
      this.OPFPostfix_Edits[ i ].setScaledFixedWidth( 80 );
      ttStr = "Output file postfix."
      this.OPFPostfix_Edits[ i ].toolTip = ttStr;
      this.OPFPostfix_Edits[ i ].onTextUpdated = function( text )
      {
         data.channels[ i ].OPFPostfix = text;
      }

      // enable postfix by default
      data.channels[ i ].prefix = "";
      this.dialog.OPFPrefix_Edits[ i ].text = data.channels[ i ].prefix;
      data.channels[ i ].postfix = channelTemplate.defaultPostfix;
      this.dialog.OPFPostfix_Edits[ i ].text = data.channels[ i ].postfix;
      this.dialog.OPFPostfix_Edits[ i ].checked = true;

      this.OPFPP_Sizers[ i ] = new HorizontalSizer;
      with( this.OPFPP_Sizers[ i ] )
      {
         margin = 4;
         spacing = 6;
         addSpacing( 60 );
         add( this.OPFPrefix_Labels[ i ] );
         add( this.OPFPrefix_Edits[ i ] );
         addSpacing( 4 );
         add( this.defaultOPFPrefix_Buttons[ i ] );
         addStretch();
         add( this.OPFPostfix_Labels[ i ] );
         add( this.OPFPostfix_Edits[ i ] );
         addSpacing( 4 );
         add( this.defaultOPFPostfix_Buttons[ i ] );
         addSpacing( 24 );
      }

      // -------------------------
      // delete button
      // -------------------------
      ttStr = "Remove this channel.";
      this.removeChannel_Buttons[ i ] = new pushButton( this, "Remove", "", ttStr );
      this.removeChannel_Buttons[ i ].resize( 10, 10 );
      this.removeChannel_Buttons[ i ].onClick = function()
      {
         data.channels[ i ].enabled = false;
         this.dialog.Output_GroupBoxes[ i ].hide();
         this.dialog.sectionBars[ i ].hide();
      }

      this.removeChannel_Sizers[ i ] = new HorizontalSizer;
      with( this.removeChannel_Sizers[ i ] )
      {
         margin = 4;
         spacing = 6;
         addStretch();
         add( this.removeChannel_Buttons[ i ] );
      }

      // -------------------------
      // group the whole control in a section bar
      // -------------------------
      this.sectionBars[ i ] = new SectionBar( this, channelTemplate.label + " Channel" );

      this.Output_GroupBoxes[ i ] = new GroupBox( this.sectionBars[ i ] );
      with( this.Output_GroupBoxes[ i ] )
      {
         title = channelTemplate.label + " Channel";
         titleCheckBox = true;
         checked = data.channels[ i ].enabled;
         setScaledFixedHeight( 120 );
         sizer = new VerticalSizer;
         sizer.margin = 4;
         sizer.spacing = 6;
         sizer.addSpacing( -44 );
         sizer.add( this.removeChannel_Sizers[ i ] );
         sizer.addSpacing( -14 );
         sizer.add( this.OPD_Sizers[ i ] );
         sizer.addSpacing( -8 );
         sizer.add( this.OPFPP_Sizers[ i ] );
         onCheck = function()
         {
            data.channels[ i ].enabled = !data.channels[ i ].enabled;
         }

         backgroundColor = Color.rgbaColor( 230, 230, 232, 255 );
      }
      this.sectionBars[ i ].setSection( this.Output_GroupBoxes[ i ] );
   }

   this.addControlsForChannelAtIndex = ( i ) =>
   {
      let sizer = this.outputControls_GroupBox.sizer;
      sizer.insert( sizer.numberOfItems - 2, this.sectionBars[ i ] );
      sizer.insert( sizer.numberOfItems - 2, this.Output_GroupBoxes[ i ] );
   }

   // -------------------------
   //          TAB "Files"
   // -------------------------

   // -------------------------
   // script info label
   // -------------------------
   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 8;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + TITLE + " v" + VERSION + "</b><br/>" +
         "A script to extract and save color space components of multiple color images.</p>" +
         "<p>Copyright &copy; 2010-2017 S J Brown<br/>" +
         "Contributions:<br/>" +
         "Copyright &copy; 2017-2019 Michael Covington<br/>" +
         "Copyright &copy; 2019 Roberto Sartori</p>";

   // -------------------------
   // input files tree control
   // -------------------------
   this.inputFiles_TreeBox = new TreeBox( this );
   with( this.inputFiles_TreeBox )
   {
      alternateRowColor = true;
      multipleSelection = false;
      headerVisible = false;
      numberOfColumns = 3;
      showColumn( 2, false );
      rootDecoration = false;
      setScaledMinSize( 450, 150 ); // width, height
   }

   // -------------------------
   // tree management buttons
   // -------------------------
   ttStr = "Add files to the input list.";
   this.addFiles_PushButton = new pushButton( this, btnText[ 0 ], "", ttStr );
   this.addFiles_PushButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select Images";
      ofd.loadImageFilters();

      if ( ofd.execute() )
      {
         this.dialog.inputFiles_TreeBox.clear();
         this.dialog.inputFiles_TreeBox.canUpdate = false;
         for ( var i = 0, n = ofd.fileNames.length; i < n; ++i )
         {
            data.inputFiles.push( ofd.fileNames[ i ] );
            ++data.ipCount;
         }

         data.inputFiles.sort();

         for ( var i = 0, n = data.ipCount; i < n; ++i )
         {
            var node = new TreeBoxNode( this.dialog.inputFiles_TreeBox );
            node.checkable = true;
            node.checked = false;
            node.setText( 0, ( i + 1 ).toString() );
            node.setText( 1, File.extractName( data.inputFiles[ i ] ) );
            node.setText( 2, data.inputFiles[ i ] );
         }
         this.dialog.inputFiles_TreeBox.canUpdate = true;
         this.dialog.inputFiles_TreeBox.adjustColumnWidthToContents( 0 );
         this.dialog.inputFiles_TreeBox.adjustColumnWidthToContents( 1 );
      }
   }

   ttStr = "Select all of the listed input files.";
   this.selectAll_PushButton = new pushButton( this, btnText[ 9 ], "", ttStr );
   this.selectAll_PushButton.onClick = function()
   {
      for ( var i = 0, n = this.dialog.inputFiles_TreeBox.numberOfChildren; i < n; ++i )
         this.dialog.inputFiles_TreeBox.child( i ).checked = true;
   }

   ttStr = "Invert the input files selection.";
   this.invertSelected_PushButton = new pushButton( this, btnText[ 5 ], "", ttStr );
   this.invertSelected_PushButton.onClick = function()
   {
      for ( var i = 0, n = this.dialog.inputFiles_TreeBox.numberOfChildren; i < n; ++i )
         this.dialog.inputFiles_TreeBox.child( i ).checked = !this.dialog.inputFiles_TreeBox.child( i ).checked;
   }

   ttStr = "Remove the selected files from the input list.";
   this.removeSelected_PushButton = new pushButton( this, btnText[ 7 ], "", ttStr );
   this.removeSelected_PushButton.onClick = function()
   {
      for ( var i = this.dialog.inputFiles_TreeBox.numberOfChildren; --i >= 0; )
         if ( this.dialog.inputFiles_TreeBox.child( i ).checked )
            this.dialog.inputFiles_TreeBox.remove( i );

      data.inputFiles.length = 0;
      data.ipCount = 0;
      for ( var i = 0, n = this.dialog.inputFiles_TreeBox.numberOfChildren; i < n; ++i )
      {
         this.dialog.inputFiles_TreeBox.child( i ).setText( 0, ( i + 1 ).toString() );
         data.inputFiles.push( this.dialog.inputFiles_TreeBox.child( i ).text( 2 ) );
         ++data.ipCount;
      }
      this.dialog.inputFiles_TreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.inputFiles_TreeBox.adjustColumnWidthToContents( 1 );
   }

   ttStr = "Remove all of the input files from the list.";
   this.clear_PushButton = new pushButton( this, btnText[ 2 ], "", ttStr );
   this.clear_PushButton.onClick = function()
   {
      this.dialog.inputFiles_TreeBox.clear();
      data.inputFiles.length = 0;
      data.ipCount = 0;
   }

   this.inputBtns_Sizer = new VerticalSizer;
   with( this.inputBtns_Sizer )
   {
      margin = 4;
      spacing = 6;
      add( this.addFiles_PushButton );
      add( this.selectAll_PushButton );
      add( this.invertSelected_PushButton );
      add( this.removeSelected_PushButton );
      add( this.clear_PushButton );
      addStretch();
   }

   this.inputControls_GroupBox = new GroupBox( this );
   with( this.inputControls_GroupBox )
   {
      title = "Input Files";
      sizer = new HorizontalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add( this.inputFiles_TreeBox );
      sizer.add( this.inputBtns_Sizer );
   }

   // -------------------------
   //    GLOBAL OPTIONS GROUP
   // -------------------------
   let labelColumnWidth = this.font.width( "mmSample Format:" );
   let ui4 = this.logicalPixelsToPhysical( 4 );

   // -------------------------
   // sample format
   // -------------------------
   this.sampleFormat_Label = new labelBox( this, "Sample Format:", TextAlign_Right | TextAlign_VertCenter, labelColumnWidth );
   this.sampleFormat_Label.setFixedWidth( labelColumnWidth );
   this.sampleFormat_ComboBox = new ComboBox( this );
   with( this.sampleFormat_ComboBox )
   {
      editEnabled = false;
      setScaledFixedWidth( 300 );
      for ( var i = 0; i < sampFrmt.length; ++i )
         addItem( sampFrmt[ i ] );
      ttStr = "Select the output file format.";
      toolTip = ttStr;

      //borrowed from 'BatchFormatConversion' script
      onItemSelected = function( index )
      {
         switch ( index )
         {
            case 0:
               data.sampleFormat = ChannelExtraction.prototype.SameAsSource
            case 1:
               data.sampleFormat = ChannelExtraction.prototype.i8;
               break;
            case 2:
               data.sampleFormat = ChannelExtraction.prototype.i16;
               break;
            case 3:
               data.sampleFormat = ChannelExtraction.prototype.i32;
               break;
            case 4:
               data.sampleFormat = ChannelExtraction.prototype.f32;
               break;
            case 5:
               data.sampleFormat = ChannelExtraction.prototype.f64;
               break;
            default: // ?
               break;
         }
      }
   }

   this.sampleFormat_Sizer = new HorizontalSizer;
   this.sampleFormat_Sizer.spacing = 4;
   this.sampleFormat_Sizer.add( this.sampleFormat_Label );
   this.sampleFormat_Sizer.add( this.sampleFormat_ComboBox );
   this.sampleFormat_Sizer.addStretch();

   // -------------------------
   // extension
   // -------------------------
   this.opfExt_Label = new labelBox( this, "Extension:", TextAlign_Right | TextAlign_VertCenter, labelColumnWidth );
   this.opfExt_Label.setFixedWidth( labelColumnWidth );
   this.opfExt_Edit = new editBox( this, "", false, FrameStyle_Box, 50 );
   this.opfExt_Edit.setScaledFixedWidth( 80 );
   this.opfExt_Edit.text = data.opfExt;
   ttStr = "Output file extension."
   this.opfExt_Edit.toolTip = ttStr;
   //borrowed from 'BatchFormatConversion' script
   this.opfExt_Edit.onEditCompleted = function()
   {
      // Image extensions are always lowercase in PI/PCL.
      var ext = this.text.trim().toLowerCase();

      // Use the default extension if empty.
      // Ensure that ext begins with a dot character.
      if ( ext.length == 0 || ext == '.' )
         ext = DEFAULT_EXTENSION;
      else if ( ext.charAt( 0 ) != '.' )
         ext = '.' + ext;

      this.text = data.opfExt = ext;
   }

   this.extension_Sizer = new HorizontalSizer;
   this.extension_Sizer.spacing = 4;
   this.extension_Sizer.add( this.opfExt_Label );
   this.extension_Sizer.add( this.opfExt_Edit );
   this.extension_Sizer.addStretch();

   // -------------------------
   // clear console option checkbox
   // -------------------------
   ttStr = "Enabling this option will clear the console of all previous output" +
      " leaving only the output from the extraction engine.<br>";
   this.clearConsole_CheckBox = new checkBox( this, "Clear Console", false, ttStr );
   this.clearConsole_CheckBox.checked = data.clearConsole;
   this.clearConsole_CheckBox.onCheck = function()
   {
      data.clearConsole = !data.clearConsole;
   }

   this.clearConsole_Sizer = new HorizontalSizer;
   this.clearConsole_Sizer.addUnscaledSpacing( labelColumnWidth + ui4 );
   this.clearConsole_Sizer.add( this.clearConsole_CheckBox );

   // -------------------------
   // save filter checkbox
   // -------------------------
   ttStr = "By enabling this option the channel name will be saved into the FITS header<br>";
   let saveFILTER_CheckBox = new checkBox( this, "Write channel into FITS header", false, ttStr );
   saveFILTER_CheckBox.checked = data.writeChannelFilter;
   saveFILTER_CheckBox.onCheck = function()
   {
      data.writeChannelFilter = !data.writeChannelFilter;
      this.dialog.filterKeyword_Edit.enabled = data.writeChannelFilter;
   }

   this.saveFilter_Sizer = new HorizontalSizer;
   this.saveFilter_Sizer.addUnscaledSpacing( labelColumnWidth + ui4 );
   this.saveFilter_Sizer.add( saveFILTER_CheckBox );

   // -------------------------
   // Global Options group
   // -------------------------
   this.outputOptions_Sizer = new VerticalSizer;
   with( this.outputOptions_Sizer )
   {
      margin = 4;
      spacing = 6;
      add( this.sampleFormat_Sizer );
      add( this.extension_Sizer );
      add( this.saveFilter_Sizer );
      add( this.clearConsole_Sizer );
   }

   this.globalOptions_GroupBox = new GroupBox( this );
   with( this.globalOptions_GroupBox )
   {
      title = "Global options";
      sizer = new HorizontalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add( this.outputOptions_Sizer );
   }

   // -------------------------
   //          TAB "Channels"
   // -------------------------

   // -------------------------
   // Add channel dropdown
   // -------------------------
   this.addChannel_Label = new labelBox( this, "<b>Add channel</b>", TextAlign_VertCenter, 120 );
   this.addChannel_ComboBox = new ComboBox( this );
   with( this.addChannel_ComboBox )
   {
      editEnabled = false;
      setScaledFixedWidth( 150 );
      addItem( " " );
      for ( var i = 0; i < channels.length; ++i )
         addItem( channels[ i ].label );
      ttStr = "Select the output channel to extract.";
      toolTip = ttStr;

      //borrowed from 'BatchFormatConversion' script
      onItemSelected = function( index )
      {
         if ( index > 0 )
         {
            data.channels.push( ChannelData( index - 1 ) );
            this.dialog.buildGroupForChannelAtIndex( data.channels.length - 1 );
            this.dialog.addControlsForChannelAtIndex( data.channels.length - 1 );
         }
         this.dialog.addChannel_ComboBox.currentItem = 0;
      }
   }

   this.addChannel_Sizer = new HorizontalSizer;
   with( this.addChannel_Sizer )
   {
      margin = 4;
      spacing = 6;
      addStretch();
      add( this.addChannel_Label );
      addSpacing( 4 );
      add( this.addChannel_ComboBox );
      addStretch();
   }

   this.clearConsoleCheckBox_Sizer = new HorizontalSizer;
   with( this.clearConsoleCheckBox_Sizer )
   {
      margin = 4;
      spacing = 6;
      addSpacing( 2 );
      add( this.addChannel_Sizer );
   }

   this.outputControls_GroupBox = new GroupBox( this );
   with( this.outputControls_GroupBox )
   {
      title = "Output Channels";
      sizer = new VerticalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.addStretch();
      sizer.addSpacing( 6 );
   }

   this.outputControls_GroupBoxSizer = new VerticalSizer;
   with( this.outputControls_GroupBoxSizer )
   {
      margin = 4;
      spacing = 6;
      add( this.outputControls_GroupBox );
   }

   // dialog control buttons
   ttStr = "Run the extraction engine for the selected input files.";
   this.ok_Button = new pushButton( this, btnText[ 4 ], "", ttStr );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   }

   ttStr = "Close the Batch File Extraction script.";
   this.cancel_Button = new pushButton( this, btnText[ 1 ], "", ttStr );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   }

   // dialog control buttons sizer
   this.buttons_Sizer = new HorizontalSizer;
   with( this.buttons_Sizer )
   {
      spacing = 6;
      addStretch();
      add( this.ok_Button );
      add( this.cancel_Button );
   }

   // PAGE TAB CONTROL
   this.filesPage = new Control( this );
   with( this.filesPage )
   {
      sizer = new VerticalSizer;
      with( sizer )
      {
         margin = 6;
         spacing = 6;
         addSpacing( 4 );
         add( this.dialog.inputControls_GroupBox );
         addSpacing( 4 );
         add( this.globalOptions_GroupBox );
      }
   }

   this.channelsPage = new Control( this );
   with( this.channelsPage )
   {
      sizer = new VerticalSizer;
      with( sizer )
      {
         margin = 6;
         spacing = 6;
         addSpacing( 4 );
         add( this.clearConsoleCheckBox_Sizer );
         addSpacing( -6 );
         add( this.outputControls_GroupBoxSizer );
         addSpacing( 4 );
      }
   }

   // main dialog TABS
   this.tabBox = new TabBox( this );

   this.tabBox.addPage( this.filesPage, "Files" );
   this.tabBox.addPage( this.channelsPage, "Channels" );
   this.tabBox.currentPageIndex = 0;
   this.sizer = new VerticalSizer;
   with( this.sizer )
   {
      spacing = 6;
      margin = 4;
      add( this.dialog.helpLabel );
      add( this.tabBox );
      add( this.buttons_Sizer );
   }

   this.setMinWidth( 620 );
   this.adjustToContents();
   this.setMinSize();

   this.windowTitle = TITLE + " Script";
}

mainDialog.prototype = new Dialog;
var maindlg = new mainDialog();

function main()
{
   console.hide();

   // Show our dialog box, quit if cancelled.
   for ( ;; )
   {
      if ( maindlg.execute() )
      {
         if ( data.inputFiles.length == 0 )
         {
            var msgStr = "<p>There are no input files listed.</p>" +
               "<p>Do you wish to continue?</p>";
            var msg = new MessageBox( msgStr, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No );
            if ( msg.execute() == StdButton_Yes )
               continue;
            else
               break;
         }
         else
         {
            console.show();
            processEvents();
            engine.execute();
            continue;
         }
      }

      break;
   }

   //console.hide();
}

main();

// ----------------------------------------------------------------------------
// EOF BatchChannelExtraction.js - Released 2018-12-27T15:17:02Z
