#feature-id    Utilities > FITS Keywords
#define VERSION   0.04

#include <pjsr/DataType.jsh>
#include <pjsr/Sizer.jsh>
//#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>

#define DEBUGGING_MODE_ON false


function copyFile( sourceFilePath, targetFilePath )
{
   var f = new File;

   f.openForReading( sourceFilePath );
   var buffer = f.read( DataType_ByteArray, f.size );
   f.close();

   f.createForWriting( targetFilePath );
   f.write( buffer );
   //f.flush(); // optional; remove if immediate writing is not required
   f.close();
}


function trim( s )
{
   return s.replace( /^\s*|\s*$/g, '' );
}

function LoadFITSKeywords( fitsFilePath )
{
   function searchCommentSeparator( b )
   {
      var inString = false;
      for ( var i = 9; i < 80; ++i )
         switch ( b.at( i ) )
         {
         case 39: // single quote
            inString ^= true;
            break;
         case 47: // slash
            if ( !inString )
               return i;
            break;
         }
      return -1;
   }

   var f = new File;
   f.openForReading( fitsFilePath );

   var keywords = new Array;
   for ( ;; )
   {
      var rawData = f.read( DataType_ByteArray, 80 );

      var name = rawData.toString( 0, 8 );
      if ( name.toUpperCase() == "END     " ) // end of HDU keyword list?
         break;

      if ( f.isEOF )
         throw new Error( "Unexpected end of file: " + fitsFilePath );

      var value;
      var comment;
      if ( rawData.at( 8 ) == 61 ) // value separator (an equal sign at byte 8) present?
      {
         // This is a valued keyword
         var cmtPos = searchCommentSeparator( rawData ); // find comment separator slash
         if ( cmtPos < 0 ) // no comment separator?
            cmtPos = 80;
         value = rawData.toString( 9, cmtPos-9 ); // value substring
         if ( cmtPos < 80 )
            comment = rawData.toString( cmtPos+1, 80-cmtPos-1 ); // comment substring
         else
            comment = new String;
      }
      else
      {
         // No value in this keyword
         value = new String;
         comment = rawData.toString( 8, 80-8 );
      }

      // Perform a naive sanity check: a valid FITS file must begin with a SIMPLE=T keyword.
      if ( keywords.length == 0 )
         if ( name != "SIMPLE  " && trim( value ) != 'T' )
            throw new Error( "File does not seem a valid FITS file: " + fitsFilePath );

      // Add new keyword. Note: use FITSKeyword with PI >= 1.6.1
      keywords.push( new FITSKeyword( name.toString(), value.toString(), comment.toString() ) );
   }
   f.close();
   return keywords;
}


//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
function MyDialog()
{
   this.__base__ = Dialog;
   this.__base__();
   this.inputFiles = new Array(); //Array of filename with full path
   this.inputKeys = new Array();  //keys
   this.keyTable = new Array();   //names of keywords from all files
   this.keyEnabled = new Array(); //selected keywords
   this.defaultKey = new Array("SET-TEMP","EXPOSURE","IMAGETYP");
   var outputDirectory = "";
   this.engine_mode = 0;       //0=move, 1=copy
   if (DEBUGGING_MODE_ON) var outputDirectory = "E:/temp";

   //------------------------------------------------------------
   this.onShow = function()
   {
//      this.filesAdd_Button.onClick();
   }

   //hide columns of unchecked keywords---------------------------
   this.hideKey = function ()
   {
      for (var i in this.keyEnabled)
         this.files_TreeBox.showColumn(parseInt(i)+1, this.keyEnabled[i]);
   }

   //----------------------------------------------------------------------------------
   // KeyWord Dialog
   this.SD = new KeyDialog( this );
   this.Key_button = new ToolButton( this );
   with ( this.Key_button )
   {
      icon = this.scaledResource( ":/images/icons/text.png" );
      toolTip = "KeyWord Dialog";
      onClick = function()
      {
         if (this.dialog.keyTable.length)
         {
            this.dialog.SD.execute();
            this.dialog.hideKey();
         }
      }
   }

   //----------------------------------------------------------
   // File List TreeBox
   this.files_TreeBox = new TreeBox( this );
   with ( this.files_TreeBox )
   {
      rootDecoration = false;
      numberOfColumns = 1;
      multipleSelection = true;
      headerVisible = true;
      setHeaderText(0, "Filename");

      onNodeUpdated = function() // Invert CheckMark
      {
         for (var i=0; i < selectedNodes.length; i++)
         {
            selectedNodes[i].checked = !selectedNodes[i].checked;
         }
         currentNode.checked = !currentNode.checked;
      }
   }


   //----------------------------------------------------------
   this.UpdateTreeBox = function ()
   {
      this.files_TreeBox.clear();
      // Accumulate all KeyNane in keyTabe
      for ( var i in this.inputFiles)
      {
         var key = this.inputKeys[i]; // keywords of one file
         var node = new TreeBoxNode( this.files_TreeBox );
         node.setText( 0, this.inputFiles[i] ); //write name to first coummn
         node.checked = true;

         for ( var j in key )
         {
            var name = key[j].name; //name of Keyword from file
            var k = this.keyTable.indexOf(name);// find index of "name" in keyTable
            if (k < 0) // new keyName
            {
               this.keyTable.push(name);//add keyword name to table
               this.files_TreeBox.numberOfColumns++;// add new column
               this.files_TreeBox.setHeaderText(this.keyTable.length, name);//set name of new column
               k = this.keyTable.length-1;
               this.keyEnabled[k] = (this.defaultKey.indexOf(name)> -1);//compare with defauld enabled keywords
            }
            if (key[j].isNumeric) node.setText( k+1, Number(key[j].value).toFixed(3) );
            else node.setText( k+1, key[j].value );
         }
      }
      this.hideKey(); //hide columns of unchecked keywords
   }

   //---------------------------------------------------------------------------------------
   this.getFiles = function (fileNames)
   {
      if (DEBUGGING_MODE_ON)
      {
         console.writeln("Found "+fileNames.length);
         console.write("Checked:.");

         //for ( var b=0; b<fileNames.length.toString().length; b++)
         //   console.write(".");
      }

      var qtyNew = 0;
      for ( var i in fileNames )
      {
         if (DEBUGGING_MODE_ON)
         {
            for ( var b=0; b<i.toString().length; b++)
               console.write("\b");
            console.write(parseInt(i)+1); processEvents();
         }
         if (this.inputFiles.indexOf(fileNames[i]) < 0) //Add file only one times
         {
            var key = LoadFITSKeywords(fileNames[i]);
            this.inputFiles.push(fileNames[i]);
            this.inputKeys.push(key);
            qtyNew++;
         }
      }
      console.writeln(" ");
      if (qtyNew == 0) {console.writeln("No new files"); return;}
      if (DEBUGGING_MODE_ON) {console.writeln("New ",qtyNew,"\nTotal ",this.inputFiles.length); processEvents();}
      this.UpdateTreeBox();
      this.QTY.text = "Total files: " + this.inputFiles.length;
      this.setScaledMinWidth(800);
      this.adjustToContents();
      this.dialog.update();
   }

   // Total file Label ---------------------------------------------------------------------------
   this.QTY = new Label( this );
   this.QTY.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   //enable/disable buttons
   this.update = function()
   {
      var enabled = !((!this.inputFiles.length) || (!outputDirectory));
      this.dialog.move_Button.enabled = enabled;
      this.dialog.copy_Button.enabled = enabled;
      this.dialog.txt_Button.enabled = enabled;
   }

   // Add files ---------------------------------------------------------------------------
   this.filesAdd_Button = new ToolButton( this );
   with ( this.filesAdd_Button )
   {
      icon = this.scaledResource( ":/images/image_container/add_files.png" );
      toolTip = "Add files";
      onClick = function()
      {
         var ofd = new OpenFileDialog;
         ofd.multipleSelections = true;
         ofd.caption = "Select FITS Files";
         ofd.filters = [["FITS Files", "*.fit", "*.fits", "*.fts"]];
         if ( ofd.execute() ) this.dialog.getFiles(ofd.fileNames);
      }
   }


   // Add Dir ---------------------------------------------------------------------------
   this.dirAdd_Button = new ToolButton( this );
   with ( this.dirAdd_Button )
   {
      icon = this.scaledResource( ":/images/icons/folders.png" );
      toolTip = "Add folder";
      onClick = function()
      {
         var gdd = new GetDirectoryDialog;
         //gdd.initialPath = outputDirectory;
         gdd.caption = "Select Input Directory";
         if ( gdd.execute() )
         {
            if (DEBUGGING_MODE_ON) {console.writeln("Start serching FITS file in SubFolders"); processEvents();}
            var fileNames = searchDirectory(gdd.directory+"/*.fit" ,true)
            .concat(searchDirectory(gdd.directory+"/*.fits",true))
            .concat(searchDirectory(gdd.directory+"/*.fts",true));
            if (DEBUGGING_MODE_ON) {console.writeln("Finish serching FITS file in SubFolders"); processEvents();}
            this.dialog.getFiles(fileNames);
         }
      }
   }

   // Close selected files ---------------------------------------------------------------------------
   this.files_close_Button = new ToolButton( this );
   with ( this.files_close_Button )
   {
      icon = this.scaledResource( ":/images/close.png" );
      toolTip = "<p>Close selected images.</p>";
      onClick = function()
      {
         if ( this.dialog.inputFiles.length == 0 ) return;
         for ( var i = this.dialog.files_TreeBox.numberOfChildren; --i >= 0; )
         {
            if ( this.dialog.files_TreeBox.child( i ).selected )
            {
               this.dialog.inputFiles.splice(i,1);
               this.dialog.inputKeys.splice(i,1);
               this.dialog.files_TreeBox.remove( i );
            }
         }
         this.dialog.QTY.text = "Total files: " + this.dialog.inputFiles.length;
         this.dialog.update();
      }
   }



   //Output Dir --------------------------------------------------------------------------------------
   this.outputDir_Edit = new Edit( this );
   this.outputDir_Edit.readOnly = true;
   this.outputDir_Edit.text = outputDirectory;
   this.outputDir_Edit.toolTip ="select output directory.";

   this.outputDirSelect_Button = new ToolButton( this );
   with ( this.outputDirSelect_Button )
   {
      icon = this.scaledResource( ":/images/icons/select.png" );
      toolTip = "Select output directory";
      onClick = function()
      {
         var gdd = new GetDirectoryDialog;
         gdd.initialPath = outputDirectory;
         gdd.caption = "Select Output Directory";
         if ( gdd.execute() )
         {
            outputDirectory = gdd.directory;
            this.dialog.outputDir_Edit.text = outputDirectory;
            this.dialog.update();
         }
      }
   }

   //engine----------------------------------------------------------------------------
   this.apply = function ()
   {
      var targetFiles = new Array();
      for ( var i in this.inputFiles)
         targetFiles[i] = outputDirectory;

      for ( var i in this.keyTable)
      {
         if (!this.keyEnabled[i]) continue;
         var name = this.keyTable[i];
         for ( var j in this.inputFiles)
         {
            var key = this.inputKeys[j];
            for (var k in key)
            {
               if (!(key[k].name == name)) continue;
               if (key[k].isNumeric)
                  var value = parseFloat(key[k].value)
               else
               {
                  var value = key[k].value;
                  value = value.replace( /'/g, "" );
                  value = value.replace( / /g, "" ); //delete left space
                  value = value.replace( /:/g, "." );
               }

               targetFiles[j] = targetFiles[j] + "/" + value;
               break;
            }
         }
      }

      var skip = 0;
      for ( var i in targetFiles)
      {
         if ( !this.files_TreeBox.child(parseInt(i)).checked ) { skip++; continue; }
         var fileDir = targetFiles[i];
         if (!File.directoryExists(fileDir)) File.createDirectory(fileDir);
         var s = this.inputFiles[i];
         var t = fileDir+"/"+File.extractName(s)+File.extractExtension(s);

         if ( File.exists( t ) )
            for ( var u = 1; ; ++u )
            {
               var tryFilePath = File.appendToName( t, '_' + u.toString() );
               if ( !File.exists( tryFilePath ) ) { t = tryFilePath; break; }
            }

         if (this.engine_mode==0)
         {
            console.writeln("move ", s," to ",t);
            File.move(s,t);
         }
         else
         {
            console.writeln("copy ", s," to ",t);
            copyFile(s,t);
         }
         processEvents();
      }
      console.writeln("Total files: ", targetFiles.length,"; Skiped: ",skip,"; Processed: ",targetFiles.length-skip);
   }

   //Engine buttons --------------------------------------------------------------------------------------
   this.move_Button = new PushButton( this );
   with ( this.move_Button )
   {
      text = "Move";
      enabled = false;
      onClick = function()
      {
         parent.apply();
         this.dialog.ok();
      }
   }

   this.copy_Button = new PushButton( this );
   with ( this.copy_Button )
   {
      text = "Copy";
      enabled = false;
      onClick = function()
      {
         parent.engine_mode = 1;
         parent.apply();
      }
   }

   this.txt_Button = new PushButton( this );
   with ( this.txt_Button )
   {
      text = "FITS.txt";
      enabled = false;
      onClick = function()
      {
         var tab = String.fromCharCode(9);
         var f = new File();
         var fileName = "FITS_keys";
         var fileDir = outputDirectory;
         var t = fileDir + "/" + fileName + ".txt";
         if ( File.exists( t ) )
         {
            for ( var u = 1; ; ++u )
            {
               for( var n = u.toString(); n.length < 4 ; n = "0" + n);
               var tryFilePath = File.appendToName( t, '-' + n );
               if ( !File.exists( tryFilePath ) ) { t = tryFilePath; break; }
            }
         }
         f.create(t);

         for ( var i in parent.keyTable)//output header
         {
            if (!parent.keyEnabled[i]) continue;
            f.outTextLn(parent.keyTable[i]+tab);
         }
         f.outTextLn("Filename"+String.fromCharCode(10,13));

         var skip = 0;
         for ( var j in parent.inputFiles)//output FITS data
         {
            if ( !parent.files_TreeBox.child(parseInt(j)).checked ) { skip++; continue; }
            var key = parent.inputKeys[j];
            for ( var i in parent.keyTable)
            {
               if (!parent.keyEnabled[i]) continue;
               var name = parent.keyTable[i];
               for (var k in key)
               {
                  if (!(key[k].name == name)) continue;
                  if (key[k].isNumeric)
                     var value = parseFloat(key[k].value)
                  else
                  {
                     var value = key[k].value;
                     value = value.replace( /'/g, "" );
                     value = value.replace( / /g, "" ); //delete left space
                     value = value.replace( /:/g, "." );
                  }

                  f.outText(value.toString());
                  for (var w = value.toString().length; w < 8; w++) f.outText(" ");
                  f.outText(tab);
                  k=-1;
                  break;
               }
               if (k > -1) f.outText("        "+tab);
            }
            f.outTextLn(parent.inputFiles[j]+String.fromCharCode(10,13));
         }
         f.close();
         console.writeln("FITSKeywords saved to ",t);
      }
   }


   //Sizer------------------------------------------------------------

   this.fileButonSizer = new HorizontalSizer;
   with ( this.fileButonSizer )
   {
      margin = 6;
      spacing = 4;
      add( this.Key_button );
      add( this.filesAdd_Button );
      add( this.dirAdd_Button );
      add( this.files_close_Button );
      add( this.QTY );
      addStretch();
   }

   this.inputFiles_GroupBox = new GroupBox( this );
   with (this.inputFiles_GroupBox)
   {
      title = "Input";
      sizer = new VerticalSizer;
      sizer.margin = 6;
      sizer.spacing = 4;
      sizer.add( this.files_TreeBox,100 );
      sizer.add( this.fileButonSizer );
   }

   this.outputDir_GroupBox = new GroupBox( this );
   with (this.outputDir_GroupBox)
   {
      title = "Output";
      sizer = new HorizontalSizer;
      sizer.margin = 6;
      sizer.spacing = 4;
      sizer.add( this.outputDir_Edit, 100 );
      sizer.add( this.outputDirSelect_Button );
   }


   this.sizer2 = new HorizontalSizer;
   with ( this.sizer2 )
   {
      spacing = 2;
      add( this.move_Button);
      add( this.copy_Button);
      add( this.txt_Button);
      addStretch();
   }


   this.sizer = new VerticalSizer;
   with ( this.sizer )
   {
      margin = 2;
      spacing = 2;
      add( this.inputFiles_GroupBox );
      add( this.outputDir_GroupBox );
      add( this.sizer2 );
   }
   //this.move(50,100); // move dialog to up-left corner

}
//End if Main Dialog------------------------------------------------------------

//Second Dialog------------------------------------------------------------
function KeyDialog( pd ) //pd - parentDialog
{
   this.__base__ = Dialog;
   this.__base__();
   this.windowTitle = "Select KeyWords";

   this.onShow = function()
   {
      var p = new Point( pd.position );
      p.moveBy( 16,16 );
      this.position = p;

      for (i in pd.keyTable)
      {
         var node = new TreeBoxNode(this.keyword_TreeBox);
         node.setText( 0, pd.keyTable[i] );
         node.checked = pd.keyEnabled[i];
      }

      this.file_ComboBox.clear();
      for (i in pd.inputFiles)
         this.file_ComboBox.addItem(pd.inputFiles[i]);
      this.file_ComboBox.onItemSelected(0);
      this.setScaledMinSize(400,600);
   }

   this.onHide = function()
   {
      for (var i in pd.keyTable)
         pd.keyEnabled[i] = this.keyword_TreeBox.child(parseInt(i)).checked;
      pd.setScaledMinWidth(800);
   }


   this.file_ComboBox = new ComboBox( this );
   with ( this.file_ComboBox )
   {
      onItemSelected = function( index )
      {
         for ( var i in pd.keyTable)
            parent.keyword_TreeBox.child(parseInt(i)).setText(1,pd.files_TreeBox.child(index).text(parseInt(i)+1));
      }

   }

   //----------------------------------------------------------
   // FITS keyword List TreeBox
   this.keyword_TreeBox = new TreeBox( this );
   with ( this.keyword_TreeBox )
   {
      toolTip = "Checkmark to include to report";
      rootDecoration = false;
      numberOfColumns = 2;
      setHeaderText(0, "name");
      setHeaderText(1, "value");
      setColumnWidth(0,100);
      setColumnWidth(1,200);
   }


   this.sizer = new VerticalSizer;
   this.sizer.margin = 4;
   this.sizer.spacing = 4;
   this.sizer.add( this.file_ComboBox );
   this.sizer.add( this.keyword_TreeBox );
   this.adjustToContents();
}

MyDialog.prototype = new Dialog;
KeyDialog.prototype = new Dialog;
var dialog = new MyDialog;
dialog.execute();

