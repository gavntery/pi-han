/*
 Search Coordinates Dialog

 This file is part of the ImageSolver script

 Copyright (C) 2013, Andres del Pozo
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef __ADP_SEARCHCOORDINATES_jsh
#define __ADP_SEARCHCOORDINATES_jsh

#ifndef TITLE
#define TITLE "Coordinates"
#endif

#include "CommonUIControls.js"

function SesameTab( parent, object )
{
   this.__base__ = Frame;
   this.__base__( parent );

   this.object = object;

   this.id_Label = new fieldLabel( this, "Object identifier:", parent.labelWidth );

   this.id_Edit = new Edit( this );
   this.id_Edit.toolTip = "Input the identifier of the desired object.";
   this.id_Edit.setFixedWidth( parent.editWidth );
   this.id_Edit.onTextUpdated = function()
   {
      this.posEq = null;
      this.parent.selected_Edit.text = "";
      this.parent.coords_Edit.text = "";
      this.parent.names_Tree.clear();
   };

   this.idSearch_Button = new ToolButton( this );
   this.idSearch_Button.icon = this.scaledResource( ":/icons/find.png" );
   this.idSearch_Button.setScaledFixedSize( 20, 20 );
   this.idSearch_Button.toolTip = "Search now";
   this.idSearch_Button.onMousePress = function()
   {
      let frame = this.parent;
      this.hasFocus = true;
      frame.names_Tree.clear();
      let results = frame.Search( frame.id_Edit.text,
                                  frame.mirror_Combo.itemText( frame.mirror_Combo.currentItem ) );
      if ( results )
         for ( let i = 0; i < results.length; ++i )
         {
            if ( results[i].posEq == null || results[i].names == null )
               continue;
            let node1 = new TreeBoxNode( frame.names_Tree );
            node1.setText( 0, results[i].name );
            node1.object = results[i];
            for ( let j = 0; j < results[i].names.length; ++j )
            {
               let node2 = new TreeBoxNode( node1 );
               node2.setText( 0, results[i].names[j] );
               node2.object = { posEq:results[i].posEq, name:results[i].names[j] };
            }
         }

      if ( frame.names_Tree.numberOfChildren == 0 )
         frame.SelectObject( null );
      else
      {
         frame.names_Tree.child( 0 ).selected = true;
         frame.SelectObject( frame.names_Tree.child( 0 ) );
      }

      this.pushed = false;
   };

   this.id_Sizer = new HorizontalSizer;
   this.id_Sizer.scaledSpacing = 4;
   this.id_Sizer.add( this.id_Label );
   this.id_Sizer.add( this.id_Edit );
   this.id_Sizer.addSpacing( 4 );
   this.id_Sizer.add( this.idSearch_Button );
   this.id_Sizer.addStretch();

   this.mirror_Label = new fieldLabel( this, "Server:", parent.labelWidth );
   this.mirror_Combo = new ComboBox( parent );
   this.mirror_Combo.setFixedWidth( parent.editWidth );
   this.mirror_Combo.editEnabled = false;
   this.mirror_Combo.toolTip = "<p>Select the best Sesame server for your location</p>";
   this.mirror_Combo.addItem( "http://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame" );
   this.mirror_Combo.addItem( "http://vizier.cfa.harvard.edu/viz-bin/nph-sesame" );
   this.mirror_Combo.currentItem = 0;
   this.mirror_Sizer = new HorizontalSizer;
   this.mirror_Sizer.scaledSpacing = 4;
   this.mirror_Sizer.add( this.mirror_Label );
   this.mirror_Sizer.add( this.mirror_Combo );
   this.mirror_Sizer.addStretch();

   this.selected_Label = new fieldLabel( this, "Selected object:", parent.labelWidth );
   this.selected_Edit = new Edit( this );
   this.selected_Edit.toolTip = "<p>Name of the selected object.</p>";
   this.selected_Edit.readOnly = true;
   this.selected_Edit.setFixedWidth( parent.editWidth );
   this.selected_Edit.text = (object && object.name) ? object.name : "";

   this.coords_Edit = new Edit( this );
   this.coords_Edit.readOnly = true;
   this.coords_Edit.toolTip = "<p>Coordinates of the selected object.</p>";
   this.coords_Edit.setFixedWidth( parent.editWidth );
   if ( object && object.posEq )
      this.coords_Edit.text = "RA:" + DMSangle.FromAngle( object.posEq.x/15 ).ToString( true ) +
                              "  Dec:" + DMSangle.FromAngle( object.posEq.y ).ToString();

   this.selected_Sizer1 = new VerticalSizer;
   this.selected_Sizer1.scaledSpacing = 4;
   this.selected_Sizer1.add( this.selected_Edit );
   this.selected_Sizer1.add( this.coords_Edit );

   this.selected_Sizer2 = new VerticalSizer;
   this.selected_Sizer2.scaledSpacing = 4;
   this.selected_Sizer2.addScaledSpacing( 3 );
   this.selected_Sizer2.add( this.selected_Label );
   this.selected_Sizer2.addStretch();

   this.selected_Sizer = new HorizontalSizer;
   this.selected_Sizer.scaledSpacing = 4;
   this.selected_Sizer.add( this.selected_Sizer2 );
   this.selected_Sizer.add( this.selected_Sizer1 );
   this.selected_Sizer.addStretch();

   this.names_Label = new fieldLabel( this, "Names:", parent.labelWidth );
   this.names_Label.textAlignment = TextAlign_Right | TextAlign_Top;
   this.names_Tree = new TreeBox( parent );
   this.names_Tree.toolTip = "<p>List of found objects. Expand the entry for each object for selecting an alternate name.</p>";
   this.names_Tree.alternateRowColor = false;
   this.names_Tree.multipleSelection = false;
   this.names_Tree.headerVisible = false;
   this.names_Tree.setFixedWidth( parent.editWidth );
   this.names_Tree.onNodeSelectionUpdated = function()
   {
      let frame = this.parent;
      if ( frame.names_Tree.selectedNodes.length == 1 )
         frame.SelectObject( frame.names_Tree.selectedNodes[0] );
      else
         frame.SelectObject( null );
   };

   this.SelectObject = function( node )
   {
      if ( node )
         this.object = node.object;
      else
         this.object = null;
      if ( this.object )
      {
         this.selected_Edit.text = this.object.name;
         this.coords_Edit.text = "RA:" + DMSangle.FromAngle( this.object.posEq.x/15 ).ToString( true ) +
                                 "  Dec:" + DMSangle.FromAngle( this.object.posEq.y ).ToString();
      }
      else
      {
         this.selected_Edit.text = "** Not found **";
         this.coords_Edit.text = "** Not found **";
      }
   };

   this.names_Sizer = new HorizontalSizer;
   this.names_Sizer.scaledSpacing = 4;
   this.names_Sizer.add( this.names_Label );
   this.names_Sizer.add( this.names_Tree );
   this.names_Sizer.addStretch();

   this.sizer = new VerticalSizer;
   this.sizer.scaledMargin = 8;
   this.sizer.scaledSpacing = 4;
   this.sizer.add( this.id_Sizer );
   this.sizer.add( this.mirror_Sizer );
   this.sizer.add( this.names_Sizer );
   this.sizer.add( this.selected_Sizer );
   this.sizer.addStretch();

   this.GetResult = function()
   {
      if ( !this.object )
      {
         let result = this.Search( this.id_Edit.text,
                                   this.mirror_Combo.itemText( this.mirror_Combo.currentItem ) );
         if ( result.length > 0 )
            return result[0];
      }
      delete this.object.names;
      return this.object;
   };

   this.Search = function( id, mirror )
   {
      let url = mirror + "/-oI/A?" + id;

      let outputFileName = File.systemTempDirectory + "/sesameResult.txt";

      console.writeln( "<end>\n<b>Searching in Sesame:</b>" );
      console.writeln( "<raw>" + url + "</raw>" );
      console.abortEnabled = true;
      console.show();

      // Send request
      let download = new FileDownload( url, outputFileName );
      try
      {
         download.perform();
      }
      catch ( e )
      {
         (new MessageBox( e.toString(), TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return null;
      }

      console.abortEnabled = false;

      if ( !download.ok )
         return null;

      let file = File.openFileForReading( outputFileName );
      if ( !file.isOpen )
         return null;
      let s = file.read( DataType_ByteArray, file.size );
      file.close();
      let queryLines = s.toString().split( "\n" );
      let object = null;
      let result = [];
      for ( let i = 0; i < queryLines.length; ++i )
      {
         if ( queryLines[i].indexOf( "#=" ) == 0 )
         {
            if ( object && object.posEq && object.names )
            {
               if ( object.name == null )
                  object.name = object.names[0];
               result.push( object );
            }
            object = {};
         }
         if ( queryLines[i].indexOf( "%J " ) == 0 )
         {
            let fields = queryLines[i].split( " " );
            object.posEq = { x:parseFloat( fields[1] ), y:parseFloat( fields[2] ) };
         }
         if ( queryLines[i].indexOf("%I ") == 0 )
         {
            if ( object.names == null )
               object.names = [];
            let name = queryLines[i].substr(3);
            if ( name.indexOf( "NAME " ) == 0 )
            {
               name = name.substr( 5 );
               if ( object.name == null )
                  object.name = name;
            }
            if ( name.indexOf( "=" ) > 0 )
            {
               name = name.substr( 0, name.indexOf( "=" ) ).trim();
            }
            object.names.push( name );
         }
      }
      if ( object && object.posEq && object.names )
      {
         if ( object.name == null )
            object.name = object.names[0];
         result.push( object );
      }
      return result;
   };
}

SesameTab.prototype = new Frame;

function ManualTab( parent, object )
{
   this.__base__ = Frame;
   this.__base__( parent );

   this.object = null;

   let spinBoxWidth = 7 * parent.font.width( 'M' );
   let labelWidth = parent.font.width( "Right Ascension (hms):" + "M" );

   this.id_Label = new fieldLabel( this, "Object identifier:", labelWidth );

   this.id_Edit = new Edit( this );
   this.id_Edit.toolTip = "Name of the object.";
   this.id_Edit.text = (object && object.name) ? object.name : "";
   this.id_Edit.setScaledFixedWidth( parent.editWidth );

   this.id_Sizer = new HorizontalSizer;
   this.id_Sizer.spacing = 4;
   this.id_Sizer.add( this.id_Label );
   this.id_Sizer.add( this.id_Edit );
   this.id_Sizer.addStretch();

   let raTooltip = "<p>Right ascension in hours.</p>";
   let decToolTip = "<p>Declination in degrees.</p>";

   // RA
   this.ra_Label = new fieldLabel( this, "Right Ascension (hms):", labelWidth );

   this.ra = (object != null && object.posEq) ? DMSangle.FromAngle( object.posEq.x/15 ) : new DMSangle;
   this.ra_h_SpinBox = new coordSpinBox( this, this.ra.deg, 23, spinBoxWidth, raTooltip,
      function( value )
      {
         this.parent.ra.deg = value;
      } );
   this.ra_min_SpinBox = new coordSpinBox( this, this.ra.min, 59, spinBoxWidth, raTooltip,
      function( value )
      {
         this.parent.ra.min = value;
      } );
   this.ra_sec_Edit = new Edit( this );
   this.ra_sec_Edit.text = format( "%.3f", this.ra.sec );
   this.ra_sec_Edit.toolTip = raTooltip;
   this.ra_sec_Edit.setFixedWidth( spinBoxWidth );
   this.ra_sec_Edit.onTextUpdated = function( value )
   {
      this.parent.ra.sec = parseFloat( value );
   };

   this.ra_Sizer = new HorizontalSizer;
   this.ra_Sizer.spacing = 4;
   this.ra_Sizer.add( this.ra_Label );
   this.ra_Sizer.add( this.ra_h_SpinBox );
   this.ra_Sizer.add( this.ra_min_SpinBox );
   this.ra_Sizer.add( this.ra_sec_Edit );
   this.ra_Sizer.addStretch();

   // DEC

   this.dec_Label = new fieldLabel( this, "Declination (dms):", labelWidth );

   this.dec = (object != null && object.posEq) ? DMSangle.FromAngle( object.posEq.y ) : new DMSangle;
   this.dec_h_SpinBox = new coordSpinBox( this, this.dec.deg, 90, spinBoxWidth, decToolTip,
      function( value )
      {
         this.parent.dec.deg = value;
      } );
   this.dec_min_SpinBox = new coordSpinBox( this, this.dec.min, 59, spinBoxWidth, decToolTip,
      function( value )
      {
         this.parent.dec.min = value;
      } );
   this.dec_sec_Edit = new Edit( this );
   this.dec_sec_Edit.text = format( "%.2f", this.dec.sec );
   this.dec_sec_Edit.toolTip = decToolTip;
   this.dec_sec_Edit.setFixedWidth( spinBoxWidth );
   this.dec_sec_Edit.onTextUpdated = function( value )
   {
      this.parent.dec.sec = parseFloat( value );
   };

   this.isSouth_CheckBox = new CheckBox( this );
   this.isSouth_CheckBox.text = "S";
   this.isSouth_CheckBox.checked = this.dec.sign < 0;
   this.isSouth_CheckBox.toolTip = "<p>When checked, the declination is negative (Southern hemisphere).</p>";
   this.isSouth_CheckBox.setScaledFixedWidth( 40 );
   this.isSouth_CheckBox.onCheck = function( checked )
   {
      this.parent.dec.sign = checked ? -1 : 1;
   };

   this.dec_Sizer = new HorizontalSizer;
   this.dec_Sizer.spacing = 4;
   this.dec_Sizer.add( this.dec_Label );
   this.dec_Sizer.add( this.dec_h_SpinBox );
   this.dec_Sizer.add( this.dec_min_SpinBox );
   this.dec_Sizer.add( this.dec_sec_Edit );
   this.dec_Sizer.add( this.isSouth_CheckBox );
   this.dec_Sizer.addStretch();

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 4;
   this.sizer.add( this.id_Sizer );
   this.sizer.add( this.ra_Sizer );
   this.sizer.add( this.dec_Sizer );
   this.sizer.addStretch();

   this.GetResult = function()
   {
      return { name: this.id_Edit.text,
               posEq: { x:this.ra.GetValue()*15, y:this.dec.GetValue() } };
   };
}

ManualTab.prototype = new Frame;

// ******************************************************************
// SearchCoordinatesDialog: Online search of coordinates
// ******************************************************************

function SearchCoordinatesDialog( object, sesame, manual )
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width( "Object identifier:M" );
   this.editWidth = this.font.width( "MMMMMMMMMMMMMMMMMMMMMMMMMMMMM" );

   this.tabs = new TabBox( this );
   let selectedPage = null;

   if ( sesame )
   {
      if ( object && object.type != null && object.type == 0 )
      {
         this.sesame_Tab = new SesameTab( this, object );
         selectedPage = this.tabs.numberOfPages;
      }
      else
         this.sesame_Tab = new SesameTab( this, null );
      this.tabs.addPage( this.sesame_Tab, "Online search" );
   }

   if ( manual )
   {
      console.writeln( JSON.stringify( object ) );
      if ( object && (object.type == null || object.type == 1) )
      {
         this.manual_Tab = new ManualTab( this, object );
         selectedPage = this.tabs.numberOfPages;
      }
      else
         this.manual_Tab = new ManualTab( this, null );
      this.tabs.addPage( this.manual_Tab, "Coordinates" );
   }

   if ( selectedPage != null )
      this.tabs.currentPageIndex = selectedPage;

   // Common Buttons
   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      let activeTab = this.dialog.tabs.currentPageControl;
      this.dialog.object = activeTab.GetResult();
      this.dialog.object.type = this.dialog.tabs.currentPageIndex;
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   //this.sizer.add( this.helpLabel );
   this.sizer.add( this.tabs );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Object Configuration";
   this.adjustToContents();
   //this.setFixedSize();
}

SearchCoordinatesDialog.prototype = new Dialog;

// ******************************************************************
// SelectImageWithCoordsDialog: Selects an image with coordinates
// ******************************************************************

function SelectImageWithCoordsDialog( serverAddress )
{
   this.__base__ = Dialog;
   this.__base__();

   this.helpLabel = new Label( this );
   this.helpLabel.text = "Select one of the images:"

   this.image_List = new TreeBox( this );
   this.image_List.alternateRowColor = false;
   this.image_List.multipleSelection = false;
   this.image_List.headerVisible = false;
   this.image_List.numberOfColumns = 1;
   this.image_List.setHeaderText( 0, "Description" );
   this.image_List.rootDecoration = false;

   let windows = ImageWindow.windows;
   for ( let i = 0; i < windows.length; ++i )
   {
      let metadata = new ImageMetadata;
      metadata.ExtractMetadata( windows[i] );
      if ( metadata.ra !== null && metadata.dec !== null )
      {
         let node = new TreeBoxNode( this.image_List );
         node.checkable = false;
         node.setText( 0, windows[i].mainView.id );
         node.window = windows[i];
         node.metadata = metadata;
      }
   }
   this.image_List.adjustColumnWidthToContents( 0 );
   //this.image_List.adjustColumnWidthToContents( 1 );
   //this.image_List.setMinWidth( this.font.width( "abc" )*25 );
   this.image_List.setMinWidth( this.image_List.columnWidth( 0 )*1.1 );

   // Buttons

   this.ok_Button = new PushButton( this );
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      if ( this.dialog.image_List.selectedNodes == 0 )
      {
         (new MessageBox( "No image has been selected.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }
      this.dialog.selectedWindow = this.dialog.image_List.selectedNodes[0].window;
      this.dialog.selectedMetadata = this.dialog.image_List.selectedNodes[0].metadata;
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.scaledSpacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   // Global sizer
   this.sizer = new VerticalSizer;
   this.sizer.scaledMargin = 8;
   this.sizer.scaledSpacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.add( this.image_List );
   this.sizer.addScaledSpacing( 6 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Select Image with Coordinates";
   this.adjustToContents();
}

SelectImageWithCoordsDialog.prototype = new Dialog;

#endif
