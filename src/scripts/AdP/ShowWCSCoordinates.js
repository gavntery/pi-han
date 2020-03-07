
// #include <pjsr/DataType.jsh>
#define SETTINGS_MODULE "SHOWWCS"
// #include "WCSmetadata.jsh"

function main()
{
   var window = ImageWindow.activeWindow;
   if ( window != null )
   {
      let summary = window.astrometricSolutionSummary();
      if ( summary.length == 0 )
         console.writeln( "The image has no WCS coordinates" );
      else
      {
         console.writeln( "<end><cbr>" );
         console.writeln( summary );
      }
//       var metadata = new ImageMetadata;
//       metadata.ExtractMetadata( window );
//       if ( metadata.ref_I_G == null )
//          console.writeln( "The image has no WCS coordinates" );
//       else
//          metadata.Print();
   }
   else
      console.writeln( "There is not active window" );
}

main();
