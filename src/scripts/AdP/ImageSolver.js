/*
   Image Plate Solver

   Plate solving of astronomical images.

   Copyright (C) 2012-2019, Andres del Pozo
   Contributions (C) 2019, Juan Conejero (PTeam)
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

/*
   Changelog:

   5.4.2: * Disable PSF fits and local distortion models in StarAlignment
            instances. This solves issues with poorly focused images and
            wide-field images acquired with consumer short focal length lenses.

   5.4.1: * Several adjustments required for the new version of StarAlignment
            included in version 1.8.7 of PixInsight.
          * Use of the new __PI_ENCODED_VERSION__ predefined preprocessor macro
            for core version control since 1.8.7.

   5.4:   * New optional algorithm for detecting distortions in the corners.
            The script splits the image in 9 tiles and tries to detect the
            distortion independently in each tile.
          * Option for omitting the optimization of the solution
          * Better star detection.

   5.3.2  * Bugfix: Fixed invalid decoding of RA and DEC keywords:
            https://pixinsight.com/forum/index.php?topic=13632.0

   5.3.1  * Added warning messages when no actual observation date has been
            specified or retrieved from existing image metadata.
          * Added a final warning on truncated thin plate spline solutions.
          * Gaia DR2 is now the automatically selected catalog for medium and
            narrow-field images.
          * Bugfix: Distortion models not generated for images loaded from
            existing disk files:
            https://pixinsight.com/forum/index.php?topic=13628.0

   5.3    * Improved distortion correction implementation. Surface splines use
            the new SurfaceSimplifier PJSR object available since PixInsight
            core version >= 1.8.6.1463. Surface simplification greatly improves
            efficiency of surface spline generation and evaluation. This allows
            us to use thousands of reference stars for a much more accurate and
            comprehensive modeling of local distortions.
          * As a result of surface simplification, the solver can now work with
            a maximum of 25000 stars (previously 5000). It could actually be
            larger, but this seems a reasonable upper limit for now.
          * New version 1.1 of the metadata stored as
            Transformation_ImageToProjection properties to describe
            spline-based coordinate transformations. The new version includes
            surface simplification parameters and the whole set of control
            points, which may include up to 25000 stars.
          * The WCSKeywords object includes new properties to store geodetic
            coordinates of the observer. These properties are acquired from
            LONG-OBS/SITELONG, LAT-OBS/SITELAT and ALT-OBS/SITEELEV keywords.
          * The limit magnitude parameter is now represented by a
            NumericControl object instead of a SpinBox. This allows defining
            limit magnitudes with one decimal precision.
          * New options for generation of diagnostics images with simplified
            surface control points.
          * Improved proper motion calculation using the Position core PJSR
            object available since PixInsight version 1.8.6.
          * Fixed errors in the interpretation of proper motion data from a few
            catalogs (whether the proper motion in right ascension is provided
            as mu_alpha multiplied by cos(delta) or not).
          * Improvements to the information provided by tool tips and console
            messages.
          * Source code refactoring and clean-up.

   5.2    * Improved calculation of proper motion corrections using the new
            Position core PJSR object.
          * PixInsight core >= 1.8.6 required.
          * Minor improvements to console and message box messages.

   5.1    * Gaia DR2 catalog

   5.0    * Ignore the previews when solving the image. Previous versions failed
            to solve the images when the first preview was very small.
          * Automatic selection of the catalog and magnitude limit

   4.2.7  * Better error management in the online catalogs

   4.2.6  * Changed the ambiguous term "Epoch" by "Obs date"

   4.2.5  * Added resetSettings and resetSettingsAndExit script parameters for
            reinitialization from PCL hybrid modules.

   4.2.4  * Bugfix: The HR catalog was named "Bright Stars " (with a trailing
            space), which was causing identification problems for PCL hybrid
            modules. See the HR_Catalog() constructor in
            AstronomicalCatalogs.jsh. See also a modification to
            CatalogRegister.FindByName().

   4.2.3  * Added generation of global control variables for invocation from
            PCL-based modules.
          * Improved some text messages and labels.

   4.2.2  * Added Gaia DR1 catalog

   4.2.1  * When solving a list of files the seed parameters for each image are now set with the following priority:
            (1) The previous astrometric solution (if it exists)
            (2) The keywords OBJCTRA, OBJCTDEC, FOCALLEN and XPIXSZ
            (3) The values in the "Image parameters" section of the configuration dialog.

   4.2    * Use downloaded catalogs

   4.1.1  * Added support for XISF files

   4.1    * Fixed layout for high DPI displays
          * Use the new dialog for selecting the VizieR mirror
          * Limited the maximum number of stars

   4.0    * Improved the algorithm for distorted images
          * Added option for noise reduction
          * Selection of the projection of the image
          * Stores the distortion as the control points of a surface spline.
          * Better star detection
          * Improved support for distortion models

   3.5.1  * Fixed: It can now solve images already solved with incompatible tags

   3.5    * Updated the URL of one of the VizieR mirrors
          * Use of weighted splines to improve the convergence of the algorithm
          * The queries to the catalog are now more efficient and the cache is kept
            between executions.
          * New option "non-interactive" for non-interactive execution

   3.4.1  * Small fixes

   3.4    * Improved the solutions using distortion models
          * Improved the calculation of nonlinear solutions using splines. Now it should be
            less prone to wild oscillations.

   3.3    * The script can now solve a list of files
          * Removed several unnecessary parameters
          * Fixed error when trying to solve images of very wide field

   3.2.1  * Fixed: when reading invalid OBJCTRA and OBJCTDEC tags the script no longer stops
          * Added support for coordinate format DDD:MM:SS in OBJCTRA and OBJCTDEC

   3.2    * Fixed initialization of "Align Algorithm" parameter in the configuration window.
          * Options for using and generating distortion models compatible with StarAlignment
          * Polynomial degree limited to 5

   3.1    * Added parameter "Align Algorithm"

   3.0.1  * Fixed the validation of the value of the resolution

   3.0    * Use of a distortion template
          * New "Only optimize" option

   2.0.1  * Removed all the usages of "with" in order to run the script in strict mode

   2.0    * Support for higher degree polynomials
          * Optimization by least squares linear regression
          * Catalogs TYCHO-2 and BrightStars
          * Advanced parameters collapsible panel

   1.7.4  * Improved error management

   1.7.3  * Fixed layout problems in PixInsight 1.8RC4
          * Another fix that increases the precision of the coordinates
          * Changed all icons to standard PI Core 1.8 resources
          * Button icons also shown on Mac OS X
          * Fixed copyright years (2012-2013)

   1.7.2  * Fixed the selection of catalogs
          * Better precision of the coordinates

   1.7.1  * Temporal fix for bug because StarAlignment uses a non-standard origin of coordinates

   1.7    * Validated for PixInsight 1.8

   1.6    * Refactored to allow its use in other scripts.

   1.51   * 2012 Apr 19 - Released as an official update.
          * Removed all instances of the 'with' JavaScript statement.
          * Fixed some text messsages.

   1.5    * Search online of initial coordinates by name or identifier

   1.4    * Adds support for saving the parameters as an icon.
          * It can be applied to an image container.
          * When Reset is pressed now it is not necessary to reopen the script
          * Fixed problem with incomplete values in DATE-OBS
          * The algorithm stops when the number of iterations is reached or the
            delta between iterations is less than 0.1 pixels
          * Code clean up

   1.3    * Support for online catalogs (PPMXL and UCAC3)
          * ransacTolerance reverted to its default value
          * Added control for the sensitivity of the star detector
          * Reset button

   1.2    * Modified for sharing code with Annotation Script
          * matcherTolerance reverted to its default value
          * Decreased to 0.05" the condition of convergence

   1.1    * Adapted to use CSV star lists with newer versions of the
            StarGenerator and StarAlignment processes.
          * General code cleanup.

   1.0    * Writes the WCS coordinates in the file
          * More accurate algorithm

   0.2    * Much better precision and speed.
          * It uses the formulas of the gnomonic projection.

   0.1.1  * Fixed error in databasePath

   0.1    * Initial test version.
*/

/* Coordinate spaces:
   Image Pixels (I): Pixels of the image in PixInsight.
         Increases from left to right and top to bottom
         The center of the top left pixel has the coordinates (0.5, 0.5)
   Star Field (S): Pixels of the reference image generated by StarGenerator.
         The axis are the same as I.
   Gnomonic projected space (G): Projected space result of projecting the celestial
         coordinates with a Gnomonic projection.
         It coincides with the World Intermediate Coordinates of WCS.
         Increases from right to left and bottom to top
         The center of the image has coordinates (0,0).
   FITS WCS pixels (F): Pixels of the image using WCS conventions
         http://fits.gsfc.nasa.gov/fits_wcs.html "Representations of World Coordinates in FITS" (Sections 2.1.4 and 5.1)
         http://fits.gsfc.nasa.gov/fits_wcs.html "Representations of celestial coordinates in FITS" (Section 5, page 1085)
         Increases from left to right and bottom to top
         The center of the bottom left pixel has the coordinates (1,1)
*/

#feature-id    Image Analysis > ImageSolver

#feature-info  A script for plate-solving astronomical images.<br/>\
               <br/>\
               Copyright &copy; 2012-2019 Andr&eacute;s del Pozo<br/>\
               Contributions &copy; 2019 Juan Conejero (PTeam)

#ifndef USE_SOLVER_LIBRARY
// Global control variable for PCL invocation.
var __PJSR_AdpImageSolver_SuccessCount = 0;
#endif

#ifndef __PI_ENCODED_VERSION__
#error This script requires PixInsight version 1.8.7 or higher.
#endif
#iflt __PI_ENCODED_VERSION__ "000100080007"
#error This script requires PixInsight version 1.8.7 or higher.
#endif

#include <pjsr/DataType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/NumericControl.jsh>

#ifndef __PJSR_SectionBar_jsh
#include <pjsr/SectionBar.jsh>
#endif

#define SOLVERVERSION "5.4.2"

#ifndef USE_SOLVER_LIBRARY
#define TITLE "Image Solver"
#define SETTINGS_MODULE "SOLVER"
//#define DEBUG

#include "WCSmetadata.jsh"
#include "AstronomicalCatalogs.jsh"
#include "SearchCoordinatesDialog.js"
#include "OptimizeSplineCoordinates.js"
#include "CatalogDownloader.js"

#define STAR_CSV_FILE   File.systemTempDirectory + "/stars.csv"
#endif

#define SETTINGS_MODULE_SCRIPT "SOLVER"

// -------------------------------------
// ENUMERATION AlignMode

function AlignAlgorithm()
{
}
AlignAlgorithm.prototype.Triangles = 0;
AlignAlgorithm.prototype.Polygons = 1;

// ******************************************************************
// SolverConfiguration: Configuration information of Solver engine
// ******************************************************************
function SolverConfiguration( module )
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      module,
      "solver",
      new Array(
         ["magnitude", DataType_Float],
         ["autoMagnitude", DataType_Boolean],
         //["polyDegree", DataType_UInt8],
         ["noiseLayers", DataType_UInt8],
         ["databasePath", DataType_UCString],
         ["generateErrorImg", DataType_Boolean],
         ["sensitivity", DataType_Double],
         ["catalogMode", DataType_UInt8], // 0=local 1=online 2=automatic
         ["vizierServer", DataType_UCString],
         ["showStars", DataType_Boolean],
         ["showSimplifiedSurfaces", DataType_Boolean],
         ["showDistortion", DataType_Boolean],
         ["generateDistortModel", DataType_Boolean],
         ["catalog", DataType_UCString],
         ["distortionCorrection", DataType_Boolean],
         ["splineSmoothing", DataType_Float],
         ["enableSimplifier", DataType_Boolean],
         ["simplifierTolerance", DataType_Float],
         ["simplifierRejectFraction", DataType_Float],
         ["useDistortionModel", DataType_Boolean],
         ["distortionModelPath", DataType_UCString],
         ["onlyOptimize", DataType_Boolean],
         ["alignAlgorithm", DataType_UInt8],
         ["useActive", DataType_Boolean],
         ["outSuffix", DataType_UCString],
         ["files", Ext_DataType_StringArray],
         ["projection", DataType_UInt8],
         ["projectionOriginMode", DataType_UInt8],
         ["distortedCorners", DataType_Boolean],
         ["optimizeSolution", DataType_Boolean]
      )
   );

   this.useActive = true;
   this.files = [];
   this.catalogMode = 2;
   this.availableCatalogs = [ new UCAC3Catalog(),
                              new PPMXLCatalog(),
                              new TychoCatalog(),
                              new HR_Catalog(),
                              new GaiaDR2_Catalog() ];
   this.vizierServer = "http://vizier.u-strasbg.fr/";
   this.magnitude = 12;
   this.noiseLayers = 0;
   this.maxIterations = 100;
   this.sensitivity = -1;
   this.generateErrorImg = false;
   this.showStars = false;
   this.catalog = "PPMXL";
   this.autoMagnitude = true;
   //this.polyDegree = 1;
   this.showSimplifiedSurfaces = false;
   this.showDistortion = false;
   this.distortionCorrection = false;
   this.splineSmoothing = 0.025;
   this.enableSimplifier = true;
   this.simplifierTolerance = 0.25;
   this.simplifierRejectFraction = 0.10;
   this.generateDistortModel = false;
   this.onlyOptimize = false;
   this.useDistortionModel = false;
   this.distortionModelPath = null;
   this.alignAlgorithm = AlignAlgorithm.prototype.Triangles;
   this.outSuffix = "_WCS";
   this.projection = 0;
   this.projectionOriginMode = 0;
   this.distortedCorners = false;
   this.optimizeSolution = true;

   this.ResetSettings = function()
   {
      Settings.remove( SETTINGS_MODULE );
   }
}

SolverConfiguration.prototype = new ObjectWithSettings;

// ----------------------------------------------------------------------------

/*
 * ImageSolverDialog: Configuration dialog for the plate solver.
 */
function ImageSolverDialog( solverCfg, metadata, showTargetImage )
{
   this.__base__ = Dialog;
   this.__base__();

   let labelWidth1 = this.font.width( "Right Ascension (hms):" + "M" );
   let radioLabelWidth = this.font.width( "Resolution (arcsec/px):" );
   let spinBoxWidth = 7*this.font.width( 'M' );

   this.solverCfg = solverCfg;

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45*this.font.width( 'M' );
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>Image Plate Solver v" + SOLVERVERSION + "</b> &mdash; "
      + "A script for plate solving astronomical images.<br/>"
      + "Copyright &copy; 2012-2019 Andr&eacute;s del Pozo<br/>"
      + "Contributions &copy; 2019 Juan Conejero (PTeam)</p>";

   // -------------------------------------------------------------------------
   // Target Image
   // -------------------------------------------------------------------------

   if ( showTargetImage )
   {
      let hasActiveWindow = ImageWindow.activeWindow && ImageWindow.activeWindow.isWindow;
      if ( !hasActiveWindow )
         solverCfg.useActive = false;

      //

      this.activeWindow_RadioButton = new RadioButton( this );
      this.activeWindow_RadioButton.text = "Active window";
      this.activeWindow_RadioButton.checked = solverCfg.useActive == true;
      this.activeWindow_RadioButton.minWidth = labelWidth1;
      this.activeWindow_RadioButton.toolTip = "<p>The script solves the image in the active window.</p>";
      this.activeWindow_RadioButton.enabled = hasActiveWindow;
      this.activeWindow_RadioButton.onCheck = function( checked )
      {
         solverCfg.useActive = true;
         this.dialog.EnableFileControls();
      };

      this.activeWindow_Sizer = new HorizontalSizer;
      this.activeWindow_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
      this.activeWindow_Sizer.add( this.activeWindow_RadioButton );
      this.activeWindow_Sizer.addStretch();

      //

      this.listOfFiles_RadioButton = new RadioButton(this);
      this.listOfFiles_RadioButton.text = "List of files";
      this.listOfFiles_RadioButton.checked = !solverCfg.useActive;
      this.listOfFiles_RadioButton.minWidth = labelWidth1;
      this.listOfFiles_RadioButton.toolTip = "<p>The script solves the images in a list of files.</p>";
      this.listOfFiles_RadioButton.onCheck = function( checked )
      {
         solverCfg.useActive = false;
         this.dialog.EnableFileControls();
      };

      this.listOfFiles_Sizer = new HorizontalSizer;
      this.listOfFiles_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
      this.listOfFiles_Sizer.add( this.listOfFiles_RadioButton );
      this.listOfFiles_Sizer.addStretch();

      //

      this.fileList_TreeBox = new TreeBox( this );
      this.fileList_TreeBox.rootDecoration = false;
      this.fileList_TreeBox.alternateRowColor = true;
      this.fileList_TreeBox.multipleSelection = true;
      this.fileList_TreeBox.headerVisible = false;
      //this.fileList_TreeBox.setScaledMinHeight( 80 );
      this.fileList_TreeBox.setScaledFixedHeight( 120 );
      this.fileList_TreeBox.numberOfColumns = 2;
      this.fileList_TreeBox.showColumn( 1, false );
      this.fileList_TreeBox.toolTip = "<p>List of files for which the geometry will be computed.</p>";
      if ( solverCfg.files )
      {
         for ( let i = 0; i < solverCfg.files.length; ++i )
         {
            let node = new TreeBoxNode( this.fileList_TreeBox );
            node.setText( 0, solverCfg.files[i] );
         }
      }
      else
         solverCfg.files = new Array();

      //

      this.addFiles_Button = new PushButton( this );
      this.addFiles_Button.text = "Add files";
      this.addFiles_Button.toolTip = "Add files to the list";
      this.addFiles_Button.onMousePress = function()
      {
         let ofd = new OpenFileDialog;
         ofd.multipleSelections = true;
         ofd.caption = "Select files";
         //ofd.loadImageFilters();
         ofd.filters = [
            [ "All supported formats", ".xisf", ".fit", ".fits", ".fts" ],
            [ "XISF Files", ".xisf"],
            [ "FITS Files", ".fit", ".fits", ".fts" ]
         ];
         if ( ofd.execute() )
         {
            for ( let i = 0; i < ofd.fileNames.length; ++i )
            {
               solverCfg.files.push( ofd.fileNames[i] );
               let node = new TreeBoxNode( this.dialog.fileList_TreeBox );
               node.checkable = false;
               node.setText( 0, ofd.fileNames[i] );
            }
            this.dialog.fileList_TreeBox.adjustColumnWidthToContents( 1 );
         }
      };

      //

      this.removeFiles_Button = new PushButton( this );
      this.removeFiles_Button.text = "Remove files";
      this.removeFiles_Button.toolTip = "<p>Removes the selected files from the list.</p>";
      this.removeFiles_Button.onMousePress = function()
      {
         for ( let i = this.dialog.fileList_TreeBox.numberOfChildren - 1; i >= 0; --i )
            if ( this.dialog.fileList_TreeBox.child(i).selected )
            {
               solverCfg.files.splice( i, 1 );
               this.dialog.fileList_TreeBox.remove( i );
            }
      };

      //

      this.clearFiles_Button = new PushButton( this );
      this.clearFiles_Button.text = "Clear files";
      this.clearFiles_Button.toolTip = "<p>Clears the list of files.</p>";
      this.clearFiles_Button.onMousePress = function()
      {
         this.dialog.fileList_TreeBox.clear();
         solverCfg.files = new Array();
      };

      //

      this.fileButtons_Sizer = new VerticalSizer;
      this.fileButtons_Sizer.spacing = 6;
      this.fileButtons_Sizer.add( this.addFiles_Button );
      this.fileButtons_Sizer.add( this.removeFiles_Button );
      this.fileButtons_Sizer.addSpacing( 8 );
      this.fileButtons_Sizer.add( this.clearFiles_Button );
      this.fileButtons_Sizer.addStretch();

      //

      this.outputFileSuffix_Label = new fieldLabel( this, "Output file suffix:", labelWidth1-4 );

      this.outputFileSuffix_Edit = new Edit( this );
      this.outputFileSuffix_Edit.text = solverCfg.outSuffix ? solverCfg.outSuffix : "";
      this.outputFileSuffix_Edit.toolTip = "<p>This suffix will be appended to each file name " +
         "when saving the plate-solving solution.</p>" +
         "<p>If this suffix is empty, the original files will be overwritten.</p>";
      this.outputFileSuffix_Edit.onTextUpdated = function( value )
      {
         solverCfg.outSuffix = value ? value.trim() : "";
      };

      this.outputFileSuffix_Sizer = new HorizontalSizer;
      this.outputFileSuffix_Sizer.spacing = 6;
      this.outputFileSuffix_Sizer.add( this.outputFileSuffix_Label );
      this.outputFileSuffix_Sizer.add( this.outputFileSuffix_Edit );
      this.outputFileSuffix_Sizer.addStretch();

      //

      this.files_Sizer2 = new HorizontalSizer;
      this.files_Sizer2.spacing = 6;
      this.files_Sizer2.add( this.fileList_TreeBox, 100 );
      this.files_Sizer2.add( this.fileButtons_Sizer );

      this.files_Control = new Control( this );
      this.files_Sizer = new VerticalSizer;
      this.files_Sizer.spacing = 6;
      this.files_Sizer.add( this.files_Sizer2, 100 );
      this.files_Sizer.add( this.outputFileSuffix_Sizer );
      this.files_Control.sizer = this.files_Sizer;

      //

      this.EnableFileControls = function ()
      {
         this.fileList_TreeBox.enabled = !solverCfg.useActive;
         this.addFiles_Button.enabled = !solverCfg.useActive;
         this.removeFiles_Button.enabled = !solverCfg.useActive;
         this.clearFiles_Button.enabled = !solverCfg.useActive;
         this.files_Control.visible = !solverCfg.useActive;
         this.setVariableHeight();
         this.targetImage_Control.adjustToContents();
         this.adjustToContents();
         if ( solverCfg.useActive )
            this.setFixedSize();
         else
            this.setMinHeight();
      };

      //

      this.targetImage_Control = new Control( this )
      this.targetImage_Control.sizer = new VerticalSizer;
      this.targetImage_Control.sizer.margin = 6;
      this.targetImage_Control.sizer.spacing = 4;
      this.targetImage_Control.sizer.add( this.activeWindow_Sizer );
      this.targetImage_Control.sizer.add( this.listOfFiles_Sizer );
      this.targetImage_Control.sizer.add( this.files_Control, 100 );

      this.targetImage_Section = new SectionBar( this, "Target Image" );
      this.targetImage_Section.setSection( this.targetImage_Control );
      this.targetImage_Section.onToggleSection = function( section, toggleBegin )
      {
         if ( !toggleBegin )
         {
            this.dialog.setVariableSize();
            this.dialog.adjustToContents();
            this.dialog.setFixedSize();
         }
      };
   } // if ( showTargetImage )

   // -------------------------------------------------------------------------
   // Image Parameters
   // -------------------------------------------------------------------------

   this.onlyApplyOptimization_CheckBox = new CheckBox( this );
   this.onlyApplyOptimization_CheckBox.text = "Only apply optimization";
   this.onlyApplyOptimization_CheckBox.checked = this.solverCfg.onlyOptimize != null && this.solverCfg.onlyOptimize;
   this.onlyApplyOptimization_CheckBox.toolTip = "<p>The solver assumes that the image is already solved, and " +
      "only optimizes the result using the current parameters.</p>";
   this.onlyApplyOptimization_CheckBox.onCheck = function( checked )
   {
      solverCfg.onlyOptimize = checked;
      this.dialog.coordinatesEpochAndScale_Control.enabled = !checked;
      this.dialog.optimizeSol_CheckBox.enabled = !checked;
   };

   this.onlyApplyOptimization_Sizer = new HorizontalSizer;
   this.onlyApplyOptimization_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.onlyApplyOptimization_Sizer.add( this.onlyApplyOptimization_CheckBox );
   this.onlyApplyOptimization_Sizer.addStretch();

   // Target object specifications

   let coordinatesTooltip = "<p>Initial equatorial coordinates. Must be inside the image.</p>";

   // CoordsEditor
   this.coords_Editor = new CoordinatesEditor( this,
            new Point( metadata.ra !== null ? metadata.ra : 0,
                       metadata.dec !== null ? metadata.dec : 0 ),
            labelWidth1, spinBoxWidth, coordinatesTooltip );

   this.search_Button = new PushButton( this );
   this.search_Button.text = "Search";
   this.search_Button.icon = this.scaledResource( ":/icons/find.png" );
   this.search_Button.onClick = function()
   {
      let search = new SearchCoordinatesDialog( null, true, false );
      search.windowTitle = "Online Coordinate Search";
      if ( search.execute() )
      {
         let object = search.object;
         if ( object == null )
            return;
         this.dialog.coords_Editor.SetCoords( object.posEq );
      }
   };

   this.coords_Sizer = new HorizontalSizer;
   this.coords_Sizer.spacing = 8;
   this.coords_Sizer.add( this.coords_Editor );
   this.coords_Sizer.add( this.search_Button );
   this.coords_Sizer.addStretch();

   //

   this.epoch_Editor = new EpochEditor( this, metadata.observationTime, labelWidth1, spinBoxWidth );

   //

   metadata.useFocal = metadata.useFocal && metadata.xpixsz != null && metadata.xpixsz > 0;

   this.focal_RadioButton = new RadioButton( this );
   this.focal_RadioButton.checked = metadata.useFocal;
   this.focal_RadioButton.enabled = metadata.xpixsz != null && metadata.xpixsz > 0;
   this.focal_RadioButton.onCheck = function( value )
   {
      this.dialog.focal_Edit.enabled = value;
      metadata.useFocal = true;
   };

   this.focal_Label = new Label( this );
   this.focal_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.focal_Label.text = "Focal distance (mm):";
   this.focal_Label.setMinWidth( radioLabelWidth );
   this.focal_Label.mouseTracking = true;
   this.focal_Label.onMouseRelease = function()
   {
      if ( this.dialog.focal_RadioButton.enabled )
      {
         this.dialog.focal_RadioButton.checked = true;
         this.dialog.focal_RadioButton.onCheck( true );
      }
   };

   this.focal_Edit = new Edit( this );
   this.focal_Edit.text = format( "%g", metadata.focal );
   this.focal_Edit.toolTip = "<p>Effective focal length of the optical system in millimeters.</p>" +
      "<p>It doesn't need to be the exact value, but it should not be more than a 50% off" +
      "&mdash;the closer the better.</p>";
   this.focal_Edit.setFixedWidth( spinBoxWidth );
   this.focal_Edit.enabled = metadata.useFocal;
   this.focal_Edit.onTextUpdated = function( value )
   {
      metadata.focal = parseFloat( value );
      if ( metadata.xpixsz )
      {
         metadata.resolution = (metadata.focal > 0) ? metadata.xpixsz/metadata.focal*0.18/Math.PI : 0;
         this.dialog.resolution_Edit.text = format( "%g", metadata.resolution*3600 );
      }
   };

   this.resolution_RadioButton = new RadioButton( this );
   this.resolution_RadioButton.checked = !metadata.useFocal;
   this.resolution_RadioButton.onCheck = function( value )
   {
      this.dialog.resolution_Edit.enabled = value;
      metadata.useFocal = false;
   };

   this.resolution_Label = new Label( this );
   this.resolution_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.resolution_Label.text = "Resolution (arcsec/px):";
   this.resolution_Label.setMinWidth( radioLabelWidth );
   this.resolution_Label.mouseTracking = true;
   this.resolution_Label.onMouseRelease = function()
   {
      this.dialog.resolution_RadioButton.checked = true;
      this.dialog.resolution_RadioButton.onCheck( true );
   };

   this.resolution_Edit = new Edit( this );
   if ( metadata.resolution != null )
      this.resolution_Edit.text = format( "%g", metadata.resolution*3600 );
   this.resolution_Edit.toolTip = "<p>Resolution of the image in arcseconds per pixel.</p>" +
      "<p>It doesn't need to be the exact value, but it should not be more than a 50% off" +
      "&mdash;the closer the better.</p>";
   this.resolution_Edit.setFixedWidth( spinBoxWidth );
   this.resolution_Edit.enabled = !metadata.useFocal;
   this.resolution_Edit.onTextUpdated = function( value )
   {
      metadata.resolution = parseFloat( value )/3600;
      if ( metadata.xpixsz )
      {
         metadata.focal = (metadata.resolution > 0) ? metadata.xpixsz/metadata.resolution*0.18/Math.PI : 0;
         this.dialog.focal_Edit.text = format( "%g", metadata.focal );
      }
   };

   this.focal_Sizer = new HorizontalSizer;
   this.focal_Sizer.spacing = 4;
   this.focal_Sizer.add( this.focal_RadioButton );
   this.focal_Sizer.add( this.focal_Label );
   this.focal_Sizer.add( this.focal_Edit);
   this.focal_Sizer.addStretch();

   this.resolution_Sizer = new HorizontalSizer;
   this.resolution_Sizer.spacing = 4;
   this.resolution_Sizer.add( this.resolution_RadioButton );
   this.resolution_Sizer.add( this.resolution_Label );
   this.resolution_Sizer.add( this.resolution_Edit);
   this.resolution_Sizer.addStretch();

   //

   this.scaleStack_Sizer = new VerticalSizer;
   this.scaleStack_Sizer.spacing = 4;
   this.scaleStack_Sizer.add( this.focal_Sizer );
   this.scaleStack_Sizer.add( this.resolution_Sizer);

   //

   this.scale_Label = new fieldLabel( this, "Image scale:", labelWidth1 );
   this.scale_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.scaleBracket_Label = new Label( this );
   this.scaleBracket_Label.textAlignment = TextAlign_VertCenter;
   this.scaleBracket_Label.text = '[';
   this.scaleBracket_Label.font = new Font( "DejaVu Sans Mono", this.font.pointSize*2 );

   this.scale_Sizer = new HorizontalSizer;
   this.scale_Sizer.spacing = 4;
   this.scale_Sizer.add( this.scale_Label );
   this.scale_Sizer.add( this.scaleBracket_Label );
   this.scale_Sizer.add( this.scaleStack_Sizer );
   this.scale_Sizer.addStretch();

   //

   this.pixelSize_Label = new fieldLabel( this, "Pixel size (um):", labelWidth1 );

   this.pixelSize_Edit = new Edit( this );
   this.pixelSize_Edit.text = (metadata.xpixsz == null) ? "7" : format( "%g", metadata.xpixsz );
   this.pixelSize_Edit.toolTip = "<p>Pixel size in micrometers. " +
      "The image is assumed to have square pixels.</p>";
   this.pixelSize_Edit.setFixedWidth( spinBoxWidth );
   this.pixelSize_Edit.onTextUpdated = function( value )
   {
      metadata.xpixsz = (value != null) ? parseFloat( value ) : 0;
      if ( metadata.xpixsz > 0 && metadata.xpixsz < 3600 )
      {
         this.dialog.focal_RadioButton.enabled = true;
         if ( metadata.useFocal )
         {
            metadata.resolution = (metadata.focal > 0) ? metadata.xpixsz/metadata.focal*0.18/Math.PI : 0;
            this.dialog.resolution_Edit.text = format( "%g", metadata.resolution*3600 );
         }
         else
         {
            metadata.focal = (metadata.resolution > 0) ? metadata.xpixsz/metadata.resolution*0.18/Math.PI : 0;
            this.dialog.focal_Edit.text = format( "%g", metadata.focal );
         }
      }
      else
      {
         this.dialog.focal_RadioButton.enabled = false;
         metadata.useFocal = false;
         this.dialog.resolution_RadioButton.checked = true;
         this.dialog.resolution_Edit.enabled = true;
      }
   };

   this.pixelSize_Sizer = new HorizontalSizer;
   this.pixelSize_Sizer.spacing = 4;
   this.pixelSize_Sizer.add( this.pixelSize_Label );
   this.pixelSize_Sizer.add( this.pixelSize_Edit );
   this.pixelSize_Sizer.addStretch();

   //

   this.coordinatesEpochAndScale_Control = new Control( this );
   this.coordinatesEpochAndScale_Control.sizer = new VerticalSizer;
   this.coordinatesEpochAndScale_Control.sizer.margin = 0;
   this.coordinatesEpochAndScale_Control.sizer.spacing = 4;
   this.coordinatesEpochAndScale_Control.sizer.add( this.coords_Sizer );
   this.coordinatesEpochAndScale_Control.sizer.add( this.epoch_Editor );
   this.coordinatesEpochAndScale_Control.sizer.add( this.scale_Sizer );
   this.coordinatesEpochAndScale_Control.sizer.add( this.pixelSize_Sizer );
   this.coordinatesEpochAndScale_Control.enabled = !solverCfg.onlyOptimize;

   //

   this.imageParameters_Control = new Control( this )

   this.imageParameters_Control.sizer = new VerticalSizer;
   this.imageParameters_Control.sizer.margin = 6;
   this.imageParameters_Control.sizer.spacing = 4;
   this.imageParameters_Control.sizer.add( this.onlyApplyOptimization_Sizer );
   this.imageParameters_Control.sizer.addSpacing( 4 );
   this.imageParameters_Control.sizer.add( this.coordinatesEpochAndScale_Control );

   this.imageParameters_Section = new SectionBar( this, "Image Parameters" );
   this.imageParameters_Section.setSection( this.imageParameters_Control );
   this.imageParameters_Section.onToggleSection = function( section, toggleBegin )
   {
      if ( !toggleBegin )
      {
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   };

   // -------------------------------------------------------------------------
   // Model Parameters
   // -------------------------------------------------------------------------

   this.automaticCatalog_RadioButton = new RadioButton( this );
   this.automaticCatalog_RadioButton.text = "Automatic catalog";
   this.automaticCatalog_RadioButton.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.automaticCatalog_RadioButton.setMinWidth( labelWidth1 );
   this.automaticCatalog_RadioButton.checked = this.solverCfg.catalogMode == 2;
   this.automaticCatalog_RadioButton.toolTip = "<p>The script selects a star catalog automatically " +
      "based on the estimated field of view of the image.</p>";
   this.automaticCatalog_RadioButton.onCheck = function( value )
   {
      this.dialog.solverCfg.catalogMode = 2;
   };

   this.automaticCatalog_Sizer = new HorizontalSizer;
   this.automaticCatalog_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.automaticCatalog_Sizer.add( this.automaticCatalog_RadioButton );
   this.automaticCatalog_Sizer.addStretch();

   //

   this.localStarCatalog_RadioButton = new RadioButton( this );
   this.localStarCatalog_RadioButton.text = "Local star catalog:";
   this.localStarCatalog_RadioButton.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.localStarCatalog_RadioButton.setMinWidth( labelWidth1 );
   this.localStarCatalog_RadioButton.checked = this.solverCfg.catalogMode == 0;
   this.localStarCatalog_RadioButton.toolTip = "<p>Use a locally stored star catalog.</p>"+
      "<p>The script supports database files for the StarGenerator process, which can be downloaded from http://pixinsight.com/download/</p>"+
   "<p>It also supports custom text files that can be created with a spreadsheet, or be downloaded from an online catalog server.</p>";
   this.localStarCatalog_RadioButton.onCheck = function( value )
   {
      this.dialog.localStarCatalog_Edit.enabled = value;
      this.dialog.localStarCatalogSelect_Button.enabled = value;
      this.dialog.distortedCorners_CheckBox.enabled = !value;
      this.dialog.solverCfg.catalogMode = 0;
   };

   this.localStarCatalogButton_Sizer = new HorizontalSizer;
   this.localStarCatalogButton_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.localStarCatalogButton_Sizer.add( this.localStarCatalog_RadioButton );
   this.localStarCatalogButton_Sizer.addStretch();

   //

   this.localStarCatalog_Edit = new Edit( this );
   if ( this.solverCfg.databasePath )
      this.localStarCatalog_Edit.text = this.solverCfg.databasePath;
   this.localStarCatalog_Edit.setScaledMinWidth( 200 );
   this.localStarCatalog_Edit.enabled = this.solverCfg.catalogMode == 0;
   this.localStarCatalog_Edit.toolTip = "<p>Path to a star database file in StarGenerator or text formats.</p>" +
      "<p>The text files can be downloaded from an online server using the download button.</p>" +
      "<p>The StarGenerator database file can be downloaded from: http://pixinsight.com/download/</p>";
   this.localStarCatalog_Edit.onTextUpdated = function( value )
   {
     solverCfg.databasePath = value;
   };

   this.localStarCatalogSelect_Button = new ToolButton( this );
   this.localStarCatalogSelect_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.localStarCatalogSelect_Button.setScaledFixedSize( 20, 20 );
   this.localStarCatalogSelect_Button.toolTip = "<p>Select a catalog file.</p>";
   this.localStarCatalogSelect_Button.enabled = this.solverCfg.catalogMode == 0;
   this.localStarCatalogSelect_Button.onClick = function()
   {
      let gdd = new OpenFileDialog;
      gdd.initialPath = this.dialog.localStarCatalog_Edit.text;
      gdd.caption = "Select Star Database Path";
      gdd.filters = [["All supported catalog files", "*.bin,*.txt"],
         ["Star database files", "*.bin"],
         ["Custom catalog files", "*.txt"]
      ];
      if ( gdd.execute() )
      {
         solverCfg.databasePath = gdd.fileName;
         this.dialog.localStarCatalog_Edit.text = gdd.fileName;
      }
   };

   this.localStarCatalogDownload_Button = new ToolButton( this );
   this.localStarCatalogDownload_Button.icon = this.scaledResource( ":/icons/download.png" );
   this.localStarCatalogDownload_Button.setScaledFixedSize( 20, 20 );
   this.localStarCatalogDownload_Button.toolTip = "<p>Download from an online catalog.</p>";
   this.localStarCatalogDownload_Button.onClick = function()
   {
      let dlg = new CatalogDownloaderDialog( metadata, solverCfg.vizierServer );
      if ( dlg.execute() )
      {
         this.dialog.localStarCatalog_Edit.text = dlg.path;
         solverCfg.databasePath = dlg.path;
      }
   };

   this.localStarCatalog_Sizer = new HorizontalSizer;
   this.localStarCatalog_Sizer.spacing = 4;
   this.localStarCatalog_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.localStarCatalog_Sizer.add( this.localStarCatalog_Edit, 100 );
   this.localStarCatalog_Sizer.add( this.localStarCatalogSelect_Button );
   this.localStarCatalog_Sizer.add( this.localStarCatalogDownload_Button );

   //

   this.onlineStarCatalog_RadioButton = new RadioButton( this );
   this.onlineStarCatalog_RadioButton.text = "Online star catalog:";
   this.onlineStarCatalog_RadioButton.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.onlineStarCatalog_RadioButton.setMinWidth( labelWidth1 );
   this.onlineStarCatalog_RadioButton.checked = this.solverCfg.catalogMode == 1;
   this.onlineStarCatalog_RadioButton.toolTip = "Use an online VizieR catalog server";
   this.onlineStarCatalog_RadioButton.onCheck = function( value )
   {
      //this.dialog.mirror_Combo.enabled = value;
      this.dialog.onlineStarCatalogSelect_Button.enabled = value;
      this.dialog.onlineStarCatalog_ComboBox.enabled = value;
      this.dialog.solverCfg.catalogMode = 1;
   }

   this.onlineStarCatalogButton_Sizer = new HorizontalSizer;
   this.onlineStarCatalogButton_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.onlineStarCatalogButton_Sizer.add( this.onlineStarCatalog_RadioButton );
   this.onlineStarCatalogButton_Sizer.addStretch();

   //

   this.onlineStarCatalog_ComboBox = new ComboBox( this );
   let toolTip = "<p>Available catalogs:</p><ul>";
   for ( let i = 0; i < this.solverCfg.availableCatalogs.length; ++i )
   {
      this.onlineStarCatalog_ComboBox.addItem( this.solverCfg.availableCatalogs[i].name );
      if ( this.solverCfg.availableCatalogs[i].name == this.solverCfg.catalog )
         this.onlineStarCatalog_ComboBox.currentItem = i;
      toolTip += "<li>" + this.solverCfg.availableCatalogs[i].description + "</li>";
   }
   toolTip+="</ul>";
   this.onlineStarCatalog_ComboBox.enabled = this.solverCfg.catalogMode == 1;
   this.onlineStarCatalog_ComboBox.editEnabled = false;
   this.onlineStarCatalog_ComboBox.setFixedWidth( this.font.width( "Bright StarsMMMMMM" ) );
   this.onlineStarCatalog_ComboBox.toolTip = toolTip;
   this.onlineStarCatalog_ComboBox.onItemSelected = function()
   {
      this.dialog.solverCfg.catalog =
         this.dialog.solverCfg.availableCatalogs[this.dialog.onlineStarCatalog_ComboBox.currentItem].name;
   };

   this.onlineStarCatalogSelect_Button = new ToolButton( this );
   this.onlineStarCatalogSelect_Button.icon = this.scaledResource( ":/icons/network-database.png" );
   this.onlineStarCatalogSelect_Button.toolTip = "<p>Select the best VizieR server for your location.</p>";
   this.onlineStarCatalogSelect_Button.enabled = solverCfg.catalogMode == 1;
   this.onlineStarCatalogSelect_Button.onClick = function()
   {
      let dlg = new VizierMirrorDialog( solverCfg.vizierServer );
      if ( dlg.execute() )
         solverCfg.vizierServer = dlg.server;
   };

   this.onlineStarCatalogTerms_Button = new ToolButton(this);
   this.onlineStarCatalogTerms_Button.text = "Terms of use of VizieR data";
   this.terms_Font = new Font( this.font.family, 6.5 );
   this.terms_Font.underline = true;
   this.onlineStarCatalogTerms_Button.font = this.terms_Font;
   this.onlineStarCatalogTerms_Button.onClick = function()
   {
      Dialog.openBrowser( "http://cds.u-strasbg.fr/vizier-org/licences_vizier.html" );
   };

   this.onlineStarCatalog_Sizer = new HorizontalSizer;
   this.onlineStarCatalog_Sizer.spacing = 4;
   this.onlineStarCatalog_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.onlineStarCatalog_Sizer.add( this.onlineStarCatalog_ComboBox );
   //this.onlineStarCatalog_Sizer.add( this.mirror_Combo);
   this.onlineStarCatalog_Sizer.add( this.onlineStarCatalogSelect_Button );
   this.onlineStarCatalog_Sizer.addStretch();
   this.onlineStarCatalog_Sizer.add( this.onlineStarCatalogTerms_Button );

   //

   this.limitMagnitude_Control = new NumericControl( this );
   this.limitMagnitude_Control.real = true;
   this.limitMagnitude_Control.label.text = "Limit magnitude:";
   this.limitMagnitude_Control.label.minWidth = labelWidth1;
   this.limitMagnitude_Control.setRange( 0, 30 );
   this.limitMagnitude_Control.slider.setRange( 0, 300 );
   this.limitMagnitude_Control.slider.minWidth = 250;
   this.limitMagnitude_Control.setPrecision( 1 );
   this.limitMagnitude_Control.enableFixedPrecision( true );
   this.limitMagnitude_Control.edit.minWidth = spinBoxWidth;
   this.limitMagnitude_Control.setValue( this.solverCfg.magnitude );
   this.limitMagnitude_Control.toolTip = "<p>Maximum star magnitude to use for the image " +
      "registration and plate-solving algorithms.</p>" +
      "<p>For wider fields, use lower limit magnitude values.</p>";
   this.limitMagnitude_Control.enabled = !this.solverCfg.autoMagnitude;
   this.limitMagnitude_Control.onValueUpdated = function( value )
   {
      solverCfg.magnitude = value;
   };

   //

   this.automaticLimitMagnitude_CheckBox = new CheckBox(this);
   this.automaticLimitMagnitude_CheckBox.text = "Automatic limit magnitude";
   this.automaticLimitMagnitude_CheckBox.toolTip = "<p>The script selects the optimal " +
      "limit magnitude automatically based on the estimated field of view of the image.</p>";
   this.automaticLimitMagnitude_CheckBox.checked = this.solverCfg.autoMagnitude;
   this.automaticLimitMagnitude_CheckBox.onCheck = function( checked )
   {
      solverCfg.autoMagnitude = checked;
      this.dialog.limitMagnitude_Control.enabled = !checked;
   };

   this.automaticLimitMagnitude_Sizer = new HorizontalSizer;
   this.automaticLimitMagnitude_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.automaticLimitMagnitude_Sizer.add( this.automaticLimitMagnitude_CheckBox );
   this.automaticLimitMagnitude_Sizer.addStretch();

   //

   this.modelParameters_Control = new Control( this )

   this.modelParameters_Control.sizer = new VerticalSizer;
   this.modelParameters_Control.sizer.margin = 6;
   this.modelParameters_Control.sizer.spacing = 4;
   this.modelParameters_Control.sizer.add( this.automaticCatalog_Sizer );
   this.modelParameters_Control.sizer.add( this.localStarCatalogButton_Sizer );
   this.modelParameters_Control.sizer.add( this.localStarCatalog_Sizer );
   this.modelParameters_Control.sizer.add( this.onlineStarCatalogButton_Sizer );
   this.modelParameters_Control.sizer.add( this.onlineStarCatalog_Sizer );
   this.modelParameters_Control.sizer.add( this.limitMagnitude_Control );
   this.modelParameters_Control.sizer.add( this.automaticLimitMagnitude_Sizer );

   this.modelParameters_Section = new SectionBar( this, "Model Parameters" );
   this.modelParameters_Section.setSection( this.modelParameters_Control );
   this.modelParameters_Section.onToggleSection = function( section, toggleBegin )
   {
      if ( !toggleBegin )
      {
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   };

   // -------------------------------------------------------------------------
   // Advanced Parameters
   // -------------------------------------------------------------------------

   this.projection_Label = new fieldLabel( this, "Projection:", labelWidth1 );

   this.projection_ComboBox = new ComboBox( this );
   this.projection_ComboBox.editEnabled = false;
   this.projection_ComboBox.toolTip = "<p>Projection system used to represent coordinate transformations.</p>";
   this.projection_ComboBox.addItem( "Gnomonic" );
   this.projection_ComboBox.addItem( "Stereographic" );
   this.projection_ComboBox.addItem( "Plate-carrée" );
   this.projection_ComboBox.addItem( "Mercator" );
   this.projection_ComboBox.addItem( "Hammer-Aitoff" );
   this.projection_ComboBox.addItem( "Zenithal equal area" );
   this.projection_ComboBox.addItem( "Orthographic" );
   if ( solverCfg.projection != null )
      this.projection_ComboBox.currentItem = solverCfg.projection;
   this.projection_ComboBox.onItemSelected = function()
   {
      solverCfg.projection = this.currentItem;
      solverCfg.projectionOriginMode = 0;
   };

   this.projection_Button = new PushButton( this );
   this.projection_Button.text = "Advanced";
   this.projection_Button.onClick = function()
   {
      (new ConfigProjectionDialog( solverCfg, solverCfg.projection )).execute();
   };

   this.projection_Sizer = new HorizontalSizer;
   this.projection_Sizer.spacing = 4;
   this.projection_Sizer.add( this.projection_Label );
   this.projection_Sizer.add( this.projection_ComboBox );
   this.projection_Sizer.add( this.projection_Button );
   this.projection_Sizer.addStretch();

   //

   this.alignmentAlgorithm_Label = new fieldLabel( this, "Alignment algorithm:", labelWidth1 );

   this.alignmentAlgorithm_ComboBox = new ComboBox( this );
   this.alignmentAlgorithm_ComboBox.editEnabled = false;
   this.alignmentAlgorithm_ComboBox.addItem( "Triangle similarity" );
   this.alignmentAlgorithm_ComboBox.addItem( "Polygons" );
   this.alignmentAlgorithm_ComboBox.currentItem = solverCfg.alignAlgorithm == AlignAlgorithm.prototype.Polygons ? 1 : 0;
   this.alignmentAlgorithm_ComboBox.toolTip = "<p>This is the star matching algorithm used by the image " +
      "registration step. There are two options:</p>" +
      "<ul><li><b>Triangle similarity</b>: Uses similarity of triangles formed with detected stars " +
      "to find pairs of matched stars. This algorithm is fast and works with most images, but may " +
      "have problems for highly distorted images.</li>" +
      "<li><b>Polygons</b>: Uses an algorithm based on the comparison of polygons, which is more robust " +
      "to local distortions and scale differences, but <i><u>does not work with mirrored images</u></i>." +
      "</li></ul>";
   this.alignmentAlgorithm_ComboBox.onItemSelected = function()
   {
      this.dialog.solverCfg.alignAlgorithm = this.dialog.alignmentAlgorithm_ComboBox.currentItem;
   };

   this.alignmentAlgorithm_Sizer = new HorizontalSizer;
   this.alignmentAlgorithm_Sizer.spacing = 4;
   this.alignmentAlgorithm_Sizer.add( this.alignmentAlgorithm_Label );
   this.alignmentAlgorithm_Sizer.add( this.alignmentAlgorithm_ComboBox );
   this.alignmentAlgorithm_Sizer.addStretch();

   //

   this.starSensitivity_Control = new NumericControl( this );
   this.starSensitivity_Control.real = true;
   this.starSensitivity_Control.label.text = "Star sensitivity:";
   this.starSensitivity_Control.label.minWidth = labelWidth1;
   this.starSensitivity_Control.setRange( -3, 3 );
   this.starSensitivity_Control.slider.setRange( 0, 1000 );
   this.starSensitivity_Control.slider.minWidth = 250;
   this.starSensitivity_Control.setPrecision( 2 );
   this.starSensitivity_Control.edit.minWidth = spinBoxWidth;
   this.starSensitivity_Control.setValue( this.solverCfg.sensitivity );
   this.starSensitivity_Control.toolTip = "<p>Logarithm of the star detection sensitivity. " +
      "Increase this value to detect less stars.</p>";
   this.starSensitivity_Control.onValueUpdated = function( value )
   {
      solverCfg.sensitivity = value;
   };

   //

   this.noiseReduction_Label = new fieldLabel( this, "Noise reduction:", labelWidth1 );

   this.noiseReduction_SpinBox = new SpinBox( this );
   this.noiseReduction_SpinBox.minValue = 0;
   this.noiseReduction_SpinBox.maxValue = 5;
   this.noiseReduction_SpinBox.value = this.solverCfg.noiseLayers;
   this.noiseReduction_SpinBox.toolTip = "<p>Number of wavelet layers that will be removed for " +
      "noise reduction. Use zero to disable noise reduction.</p>";
   this.noiseReduction_SpinBox.setFixedWidth( spinBoxWidth );
   this.noiseReduction_SpinBox.onValueUpdated = function( value )
   {
      solverCfg.noiseLayers = value;
   };

   this.noiseReduction_Sizer = new HorizontalSizer;
   this.noiseReduction_Sizer.spacing = 4;
   this.noiseReduction_Sizer.add( this.noiseReduction_Label );
   this.noiseReduction_Sizer.add( this.noiseReduction_SpinBox );
   this.noiseReduction_Sizer.addStretch();

   //

   this.optimizeSol_CheckBox = new CheckBox( this );
   this.optimizeSol_CheckBox.text = "Optimize the solution";
   this.optimizeSol_CheckBox.checked = this.solverCfg.optimizeSolution;
   this.optimizeSol_CheckBox.enabled = !this.solverCfg.onlyOptimize;
   this.optimizeSol_CheckBox.toolTip = "<p>When checked, the astrometric solution is optimized using " +
      "the precise star positions calculated using DynamicPSF.</p>" +
      "<p>When the image has been heavily processed and/or stretched, the PSF extraction could fail, " +
      "so the result could be worse than before the optimization.</p>";
   this.optimizeSol_CheckBox.onCheck = function( checked )
   {
      solverCfg.optimizeSolution = checked;
   };

   this.optimizeSol_Sizer = new HorizontalSizer;
   this.optimizeSol_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.optimizeSol_Sizer.add( this.optimizeSol_CheckBox );
   this.optimizeSol_Sizer.addStretch();

   //

   this.showStars_CheckBox = new CheckBox( this );
   this.showStars_CheckBox.text = "Show stars";
   this.showStars_CheckBox.checked = this.solverCfg.showStars;
   this.showStars_CheckBox.toolTip = "<p>When checked, generates a new image with corss marks at the " +
      "positions of the detected stars in the original image.</p>" +
      "<p>These control images are useful to compare the results of different values of the detection " +
      "sensitivity parameter.</p>";
   this.showStars_CheckBox.onCheck = function( checked )
   {
      solverCfg.showStars = checked;
   };

   this.showStars_Sizer = new HorizontalSizer;
   this.showStars_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.showStars_Sizer.add( this.showStars_CheckBox );
   this.showStars_Sizer.addStretch();

   //

   this.generateResidualsImage_CheckBox = new CheckBox( this );
   this.generateResidualsImage_CheckBox .text = "Generate residuals image";
   this.generateResidualsImage_CheckBox.checked = this.solverCfg.generateErrorImg != null && this.solverCfg.generateErrorImg;
   this.generateResidualsImage_CheckBox.toolTip = "<p>Generates an image with the predicted star positions " +
      "(green checkmarks) and arrows (red lines) pointing to the actual measured positions on the image.</p>" +
      "<p>These control images can be used to analyze the errors of the computed solutions.</p>";
   this.generateResidualsImage_CheckBox.onCheck = function( checked )
   {
      solverCfg.generateErrorImg = checked;
   };

   this.generateResidualsImage_Sizer = new HorizontalSizer;
   this.generateResidualsImage_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.generateResidualsImage_Sizer.add( this.generateResidualsImage_CheckBox );
   this.generateResidualsImage_Sizer.addStretch();

   //

   this.advancedParameters_Control = new Control( this );
   this.advancedParameters_Control.hide();

   this.advancedParameters_Control.sizer = new VerticalSizer;
   this.advancedParameters_Control.sizer.margin = 6;
   this.advancedParameters_Control.sizer.spacing = 4;
   this.advancedParameters_Control.sizer.add( this.projection_Sizer );
   this.advancedParameters_Control.sizer.add( this.alignmentAlgorithm_Sizer );
   this.advancedParameters_Control.sizer.add( this.starSensitivity_Control );
   this.advancedParameters_Control.sizer.add( this.noiseReduction_Sizer );
   this.advancedParameters_Control.sizer.add( this.optimizeSol_Sizer );
   this.advancedParameters_Control.sizer.add( this.showStars_Sizer );
   this.advancedParameters_Control.sizer.add( this.generateResidualsImage_Sizer );

   this.advancedParameters_Section = new SectionBar( this, "Advanced Parameters" );
   this.advancedParameters_Section.setSection( this.advancedParameters_Control );
   this.advancedParameters_Section.onToggleSection = function( section, toggleBegin )
   {
      if ( !toggleBegin )
      {
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   }

   // -------------------------------------------------------------------------
   // Distortion Correction
   // -------------------------------------------------------------------------

   this.distortedCorners_CheckBox = new CheckBox( this );
   this.distortedCorners_CheckBox.text = "Advanced alignment";
   this.distortedCorners_CheckBox.checked = this.solverCfg.distortedCorners;
   this.distortedCorners_CheckBox.toolTip = "<p>This option splits the image in nine cells and calculates the "+
      "distortion independently for each one.</p><p>This algorithm is slower but works much better when the "+
      "corners of the image are very distorted. This is usually the case for images taken with consumer short "+
      "focal lenses.</p>";
   this.distortedCorners_CheckBox.onCheck = function( checked )
   {
      solverCfg.distortedCorners = checked;
   };
   this.distortedCorners_CheckBox.enabled = this.solverCfg.catalogMode != 0;

   this.distortedCorners_Sizer = new HorizontalSizer;
   this.distortedCorners_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.distortedCorners_Sizer.add( this.distortedCorners_CheckBox );
   this.distortedCorners_Sizer.addStretch();

   //

   this.splineSmoothing_Control = new NumericControl( this );
   this.splineSmoothing_Control.real = true;
   this.splineSmoothing_Control.label.text = "Spline smoothing:";
   this.splineSmoothing_Control.label.minWidth = labelWidth1;
   this.splineSmoothing_Control.setRange( 0, 0.5 );
   this.splineSmoothing_Control.slider.setRange( 0, 1000 );
   this.splineSmoothing_Control.slider.minWidth = 250;
   this.splineSmoothing_Control.setPrecision( 3 );
   this.splineSmoothing_Control.edit.minWidth = spinBoxWidth;
   this.splineSmoothing_Control.setValue( this.solverCfg.splineSmoothing );
   this.splineSmoothing_Control.toolTip = "<p>When this parameter is greater than zero, " +
      "approximating surface splines will be generated instead of interpolating splines. " +
      "The higher this value, the closest will be the 2-D approximating surface to the " +
      "reference plane of the image. Approximating surface splines are robust to outlier " +
      "control points and hence recommended in virtually all cases. The default value of " +
      "0.025 is normally quite appropriate when surface simplification is enabled.</p>";
   this.splineSmoothing_Control.onValueUpdated = function( value )
   {
      solverCfg.splineSmoothing = value;
   };

   //

   this.enableSimplifier_CheckBox = new CheckBox( this );
   this.enableSimplifier_CheckBox.text = "Use surface simplifiers";
   this.enableSimplifier_CheckBox.checked = this.solverCfg.enableSimplifier;
   this.enableSimplifier_CheckBox.toolTip = "<p>If enabled, a surface simplification " +
      "algorithm will be applied to the lists of control points for surface spline generation. " +
      "The use of surface simplification greatly improves efficiency of surface splines by " +
      "removing all redundant points and keeping only the control points required to define " +
      "the coordinate transformations accurately. In addition, the applied surface simplification " +
      "algorithm implements robust PCA fitting and outlier rejection techniques that improve the " +
      "generated interpolation devices in terms of resilience to noise and invalid data in the " +
      "underlying astrometric solution. This option should normally be enabled.</p>";
   this.enableSimplifier_CheckBox.onCheck = function( checked )
   {
      solverCfg.enableSimplifier = checked;
      this.dialog.simplifierTolerance_Control.enabled = checked;
      this.dialog.simplifierRejectFraction_Control.enabled = checked;
   };

   this.enableSimplifier_Sizer = new HorizontalSizer;
   this.enableSimplifier_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.enableSimplifier_Sizer.add( this.enableSimplifier_CheckBox );
   this.enableSimplifier_Sizer.addStretch();

   //

   this.simplifierTolerance_Control = new NumericControl( this );
   this.simplifierTolerance_Control.real = true;
   this.simplifierTolerance_Control.label.text = "Simplifier tolerance:";
   this.simplifierTolerance_Control.label.minWidth = labelWidth1;
   this.simplifierTolerance_Control.setRange( 0, 1.0 );
   this.simplifierTolerance_Control.slider.setRange( 0, 500 );
   this.simplifierTolerance_Control.slider.minWidth = 250;
   this.simplifierTolerance_Control.setPrecision( 2 );
   this.simplifierTolerance_Control.edit.minWidth = spinBoxWidth;
   this.simplifierTolerance_Control.setValue( this.solverCfg.simplifierTolerance );
   this.simplifierTolerance_Control.enabled = this.solverCfg.enableSimplifier;
   this.simplifierTolerance_Control.toolTip = "<p>Tolerance of the surface simplification " +
      "algorithm in pixels. The default value of 0.25 pixels is appropriate in most cases.</p>";
   this.simplifierTolerance_Control.onValueUpdated = function( value )
   {
      solverCfg.simplifierTolerance = value;
   };

   //

   this.simplifierRejectFraction_Control = new NumericControl( this );
   this.simplifierRejectFraction_Control.real = true;
   this.simplifierRejectFraction_Control.label.text = "Simplifier rejection:";
   this.simplifierRejectFraction_Control.label.minWidth = labelWidth1;
   this.simplifierRejectFraction_Control.setRange( 0, 0.5 );
   this.simplifierRejectFraction_Control.slider.setRange( 0, 500 );
   this.simplifierRejectFraction_Control.slider.minWidth = 250;
   this.simplifierRejectFraction_Control.setPrecision( 2 );
   this.simplifierRejectFraction_Control.edit.minWidth = spinBoxWidth;
   this.simplifierRejectFraction_Control.setValue( this.solverCfg.simplifierRejectFraction );
   this.simplifierRejectFraction_Control.enabled = this.solverCfg.enableSimplifier;
   this.simplifierRejectFraction_Control.toolTip = "<p>Fraction of rejected control points for " +
      "simplification of surface subregions. The default value is 0.1.</p>";
   this.simplifierRejectFraction_Control.onValueUpdated = function( value )
   {
      solverCfg.simplifierRejectFraction = value;
   };

   //

   this.showSimplifiedSurfaces_CheckBox = new CheckBox( this );
   this.showSimplifiedSurfaces_CheckBox.text = "Show simplified surfaces";
   this.showSimplifiedSurfaces_CheckBox.checked = this.solverCfg.showSimplifiedSurfaces != null && this.solverCfg.showSimplifiedSurfaces;
   this.showSimplifiedSurfaces_CheckBox.toolTip = "<p>This option generates an image with " +
      "cross marks on simplified surface control points. These control images are useful " +
      "to evaluate the suitability of surface simplification parameters to model image distortions.</p>";
   this.showSimplifiedSurfaces_CheckBox.onCheck = function( checked )
   {
      solverCfg.showSimplifiedSurfaces = checked;
   };

   this.showSimplifiedSurfaces_Sizer = new HorizontalSizer;
   this.showSimplifiedSurfaces_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.showSimplifiedSurfaces_Sizer.add( this.showSimplifiedSurfaces_CheckBox );
   this.showSimplifiedSurfaces_Sizer.addStretch();

   //

   this.showDistortionMap_CheckBox = new CheckBox( this );
   this.showDistortionMap_CheckBox.text = "Show distortion map";
   this.showDistortionMap_CheckBox.checked = this.solverCfg.showDistortion != null && this.solverCfg.showDistortion;
   this.showDistortionMap_CheckBox.toolTip = "<p>This option generates an image that shows the " +
      "distortion map of the image. It plots the difference between the final spline-based " +
      "solution and a linear solution.</p>";
   this.showDistortionMap_CheckBox.onCheck = function( checked )
   {
      solverCfg.showDistortion = checked;
   };

   this.showDistortionMap_Sizer = new HorizontalSizer;
   this.showDistortionMap_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.showDistortionMap_Sizer.add( this.showDistortionMap_CheckBox );
   this.showDistortionMap_Sizer.addStretch();

   //

   let distortionModelToolTip = "<p>When a distortion model is selected, the solver uses it " +
      "as a model of the local distortions in the image. This model uses the same format as " +
      "the StarAlignment tool and can be generated using the ManualImageSolver or ImageSolver " +
      "scripts. The model should be generated using an image acquired with the same camera and " +
      "lenses, at the same focal and aperture.</p>";

   this.useDistortionModel_CheckBox = new CheckBox( this );
   this.useDistortionModel_CheckBox.text = "Use distortion model:";
   this.useDistortionModel_CheckBox.checked = this.solverCfg.useDistortionModel;
   this.useDistortionModel_CheckBox.toolTip = distortionModelToolTip;
   this.useDistortionModel_CheckBox.onCheck = function( checked )
   {
      solverCfg.useDistortionModel = checked;
      this.dialog.distortionModel_Edit.enabled = checked;
   };

   this.useDistortionModel_Sizer = new HorizontalSizer;
   this.useDistortionModel_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.useDistortionModel_Sizer.add( this.useDistortionModel_CheckBox );
   this.useDistortionModel_Sizer.addStretch();

   //

   this.distortionModel_Edit = new Edit( this );
   if ( this.solverCfg.distortionModelPath )
      this.distortionModel_Edit.text = this.solverCfg.distortionModelPath;
   this.distortionModel_Edit.setScaledMinWidth( 200 );
   this.distortionModel_Edit.enabled = this.solverCfg.useDistortionModel;
   this.distortionModel_Edit.toolTip = distortionModelToolTip;
   this.distortionModel_Edit.onTextUpdated = function( value )
   {
      solverCfg.distortionModelPath = value;
   };

   this.distortionModelClear_Button = new ToolButton( this );
   this.distortionModelClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.distortionModelClear_Button.setScaledFixedSize( 20, 20 );
   this.distortionModelClear_Button.toolTip = "<p>Clear the StarGenerator database file path.</p>";
   this.distortionModelClear_Button.onClick = function()
   {
      solverCfg.distortionModelPath = null;
      this.dialog.distortionModel_Edit.text = "";
   };

   this.distortionModelSelect_Button = new ToolButton( this );
   this.distortionModelSelect_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.distortionModelSelect_Button.setScaledFixedSize( 20, 20 );
   this.distortionModelSelect_Button.toolTip = "<p>Select a StarGenerator database file.</p>";
   this.distortionModelSelect_Button.onClick = function()
   {
      let ofd = new OpenFileDialog;
      ofd.initialPath = this.dialog.distortionModel_Edit.text;
      ofd.caption = "Select a distortion model";
      ofd.filters = [
         ["Distortion models (*.csv)", "*.csv"]
      ];
      if ( ofd.execute() )
      {
         solverCfg.distortionModelPath = ofd.fileName;
         this.dialog.distortionModel_Edit.text = ofd.fileName;
      }
   };

   this.distortionModel_Sizer = new HorizontalSizer;
   this.distortionModel_Sizer.spacing = 4;
   this.distortionModel_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.distortionModel_Sizer.add( this.distortionModel_Edit, 100 );
   this.distortionModel_Sizer.add( this.distortionModelClear_Button );
   this.distortionModel_Sizer.add( this.distortionModelSelect_Button );

   //

   this.generateDistortionModel_CheckBox = new CheckBox( this );
   this.generateDistortionModel_CheckBox.text = "Generate distortion model";
   this.generateDistortionModel_CheckBox.checked = this.solverCfg.generateDistortModel != null && this.solverCfg.generateDistortModel;
   this.generateDistortionModel_CheckBox.toolTip = "<p>Generates a distortion model in CSV format, " +
      "compatible with the StarAlignment process.</p>";
   this.generateDistortionModel_CheckBox.onCheck = function( checked )
   {
      solverCfg.generateDistortModel = checked;
      this.dialog.useDistortionModel_CheckBox.checked = false;
   };

   this.generateDistortionModel_Sizer = new HorizontalSizer;
   this.generateDistortionModel_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.generateDistortionModel_Sizer.add( this.generateDistortionModel_CheckBox );
   this.generateDistortionModel_Sizer.addStretch();

   //

   this.distortionCorrection_Control = new Control( this );
   this.distortionCorrection_Control.enabled = this.solverCfg.distortionCorrection;
   this.distortionCorrection_Control.hide();

   this.distortionCorrection_Control.sizer = new VerticalSizer;
   this.distortionCorrection_Control.sizer.margin = 6;
   this.distortionCorrection_Control.sizer.spacing = 4;
   this.distortionCorrection_Control.sizer.add( this.distortedCorners_Sizer );
   this.distortionCorrection_Control.sizer.add( this.splineSmoothing_Control );
   this.distortionCorrection_Control.sizer.add( this.enableSimplifier_Sizer );
   this.distortionCorrection_Control.sizer.add( this.simplifierTolerance_Control );
   this.distortionCorrection_Control.sizer.add( this.simplifierRejectFraction_Control );
   this.distortionCorrection_Control.sizer.add( this.showSimplifiedSurfaces_Sizer );
   this.distortionCorrection_Control.sizer.add( this.showDistortionMap_Sizer );
   this.distortionCorrection_Control.sizer.add( this.useDistortionModel_Sizer );
   this.distortionCorrection_Control.sizer.add( this.distortionModel_Sizer );
   this.distortionCorrection_Control.sizer.add( this.generateDistortionModel_Sizer );

   this.distortionCorrection_Section = new SectionBar( this, "Distortion Correction" );
   this.distortionCorrection_Section.setSection( this.distortionCorrection_Control );
   this.distortionCorrection_Section.enableCheckBox( true );
   this.distortionCorrection_Section.checkBox.checked = this.solverCfg.distortionCorrection;
   this.distortionCorrection_Section.checkBox.toolTip = "<p>This option builds a model of the local distortions " +
      "of the image using approximating 2-D surface splines, also known as <i>thin plate splines.</i></p>";
   this.distortionCorrection_Section.onCheckSection = function( sectionbar )
   {
      solverCfg.distortionCorrection = sectionbar.checkBox.checked;
      this.dialog.distortionCorrection_Control.enabled = solverCfg.distortionCorrection;
      if ( sectionbar.isCollapsed() )
         sectionbar.toggleSection();
   };
   this.distortionCorrection_Section.onToggleSection = function( section, toggleBegin )
   {
      if( !toggleBegin )
      {
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   }

   // -------------------------------------------------------------------------
   // Control Buttons
   // -------------------------------------------------------------------------

   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function()
   {
      if ( !this.dialog.Validate() )
         return;

      this.hasFocus = true;

      metadata.SaveParameters();
      solverCfg.SaveParameters();

      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton( this );
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
   this.reset_Button.toolTip = "<p>Resets script settings to factory-default values.</p>"+
      "<p>This action closes this dialog window, so the script must be executed again.</p>";
   this.reset_Button.onClick = function()
   {
      let msg = new MessageBox( "Do you really want to reset all settings to their default values?",
         TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No );
      if ( msg.execute() == StdButton_Yes )
      {
         this.dialog.solverCfg.ResetSettings();
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.help_Button = new ToolButton(this);
   this.help_Button.icon = this.scaledResource( ":/process-interface/browse-documentation.png" );
   this.help_Button.setScaledFixedSize( 20, 20 );
   this.help_Button.toolTip = "<p>Browse Documentation</p>";
   this.help_Button.onClick = function ()
   {
      Dialog.browseScriptDocumentation( "ImageSolver" );
   };

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      if ( !this.dialog.Validate() )
         return;

      if ( metadata.observationTime == 2451545.0 )
         if ( metadata.epoch == null )
            if ( (new MessageBox( "<p>You have not specified an actual observation date, and we cannot retrieve "
                                + "it from existing image metadata. The computed astrometric solution may not "
                                + "be valid as a result of inaccurate star proper motions.</p>"
                                + "<p><b>Do you want to continue anyway?</b></p>",
                                  TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No )).execute() != StdButton_Yes )
            {
               return;
            }

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
   this.buttons_Sizer.add( this.newInstanceButton );
   this.buttons_Sizer.add( this.reset_Button );
   this.buttons_Sizer.add( this.help_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   // -------------------------------------------------------------------------
   // Global sizer
   // -------------------------------------------------------------------------

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   if ( showTargetImage )
   {
      this.sizer.add( this.targetImage_Section );
      this.sizer.add( this.targetImage_Control, 100 );
   }
   this.sizer.add( this.imageParameters_Section );
   this.sizer.add( this.imageParameters_Control );
   this.sizer.add( this.modelParameters_Section );
   this.sizer.add( this.modelParameters_Control );
   this.sizer.add( this.advancedParameters_Section );
   this.sizer.add( this.advancedParameters_Control );
   this.sizer.add( this.distortionCorrection_Section );
   this.sizer.add( this.distortionCorrection_Control );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Image Plate Solver Script";

   if ( showTargetImage )
      this.EnableFileControls(); // which changes size constraints
   else
   {
      this.adjustToContents();
      this.setFixedSize();
   }

   // -------------------------------------------------------------------------

   this.Validate = function()
   {
      try
      {
         if ( metadata.useFocal )
         {
            if ( metadata.focal <= 0 )
               throw "Invalid focal length.";
            if ( metadata.xpixsz <= 0 || metadata.xpixsz > 120 )
               throw "Invalid pixel size.";
         }

         if ( !solverCfg.onlyOptimize )
            if ( metadata.resolution == null || metadata.resolution <= 0 || metadata.resolution > 1800/3600 )
               throw "Invalid image resolution.";

         let coords = this.coords_Editor.GetCoords();
         if ( coords.x < 0 || coords.x > 360 )
            throw "Invalid right ascension.";
         if ( coords.y < -90 || coords.y > +90 )
            throw "Invalid declination.";

         if( solverCfg.useDistortionModel )
            if ( solverCfg.distortionModelPath == null || solverCfg.distortionModelPath.trim().length == 0 )
               throw "The distortion model path is empty.";

         metadata.ra = coords.x;
         metadata.dec = coords.y;

         let t = this.epoch_Editor.getEpoch();
         if ( t != metadata.observationTime )
         {
            metadata.observationTime = t;
            if ( metadata.epoch == null )
               if ( t != 2451545.0 )
                  metadata.epoch = t;
         }

         if ( solverCfg.catalogMode == 0 )
         {
            solverCfg.distortedCorners = false;
            console.warningln( "XXX!!!" );
         }

         return true;
      }
      catch ( ex )
      {
         new MessageBox( ex, TITLE, StdIcon_Error ).execute();
         return false;
      }
   };
}

ImageSolverDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

/*
 * ImageSolver: Implementation of the plate solving algorithm.
 */
function ImageSolver()
{
   let error;
   this.solverCfg = new SolverConfiguration(SETTINGS_MODULE_SCRIPT);
   this.metadata = new ImageMetadata(SETTINGS_MODULE_SCRIPT);

   // Initializes the image solver. If the parameter prioritizeSettings is
   // defined and is true, the solver will use the values stored in preferences
   // instead of the values obtained from the image.
   this.Init = function( w, prioritizeSettings )
   {
      this.solverCfg.LoadSettings();
      this.solverCfg.LoadParameters();

      // ### N.B.: Be compatible with versions < 4.2.4
      this.solverCfg.catalog = this.solverCfg.catalog.trim();

      if ( prioritizeSettings )
      {
         if ( w && w.isWindow )
            this.metadata.ExtractMetadata( w );
         this.metadata.LoadSettings();
         this.metadata.LoadParameters();
      }
      else
      {
         this.metadata.LoadSettings();
         this.metadata.LoadParameters();
         if ( w && w.isWindow )
            this.metadata.ExtractMetadata( w );
      }
   };

   this.DoAlign = function( window, clipRect )
   {
      let align = new StarAlignment;
      align.referenceImage = STAR_CSV_FILE;
      align.referenceIsFile = true;
      align.writeKeywords = false;
      align.sensitivity = Math.pow( 10, this.solverCfg.sensitivity );
      align.noGUIMessages = true;
      align.useTriangles = this.solverCfg.alignAlgorithm != AlignAlgorithm.prototype.Polygons;
      align.polygonSides = 5;
      align.restrictToPreviews = clipRect != null;
      //align.onError = StarAlignment.prototype.Continue;
      if ( this.solverCfg.useDistortionModel )
         align.distortionModel = this.solverCfg.distortionModelPath;
      if ( this.solverCfg.distortionCorrection )
      {
         align.useSurfaceSplines = true;
         align.distortionCorrection = true;
         align.localDistortion = false; // ### TODO: Use SA's local distortion models to improve plate solving.
         align.fitPSF = StarAlignment.prototype.FitPSF_Never;
         align.distortionMaxIterations = 50;
         // align.distortionTolerance = 0.25; // this is no longer functional since core version 1.8.7
      }
      align.undistortedReference = true;
      if ( this.solverCfg.noiseLayers > 0 )
         align.noiseLayers = this.solverCfg.noiseLayers;

      let view = null;
      if ( clipRect )
         view = window.createPreview( clipRect, "ImageSolverClipArea" );
      else
         view = window.currentView;

      try
      {
         if ( this.solverCfg.showStars && !this.starsShown )
         {
            align.mode = StarAlignment.prototype.DrawStars;
            align.executeOn( view, false );
            this.starsShown = true;
         }

         align.mode = StarAlignment.prototype.OutputMatrix;

         if ( align.useTriangles )
            console.writeln( "Using the triangle similarity star matching algorithm." );
         else
            console.writeln( "Using the polygon star matching algorithm with ", align.polygonSides, " sides." );

         if ( !align.executeOn( view, false/*swapFile*/ ) )
            throw "The image could not be aligned with the reference star field";

         let numPairs = align.outputData[0][2];
         let pairs = { pS: new Array( numPairs ),
                     pI: new Array( numPairs ) };
         for ( let i = 0; i < numPairs; ++i )
         {
            // pairs.pS[i] = new Point( align.outputData[0][29][i] + 0.5, align.outputData[0][30][i] + 0.5 );
            pairs.pS[i] = new Point( align.outputData[0][29][i], align.outputData[0][30][i] );
            pairs.pI[i] = new Point( align.outputData[0][31][i] + 0.5, align.outputData[0][32][i] + 0.5 );
         }
         return pairs;
      }
      finally
      {
         if ( clipRect )
            window.deletePreview( view );
      }
   };

   this.GenerateTemplate = function( metadata, templateGeom )
   {
      if ( this.useStarGeneratorCatalog )
      {
         if ( templateGeom.clipRectS )
            throw "The local catalog does not support clipping areas." // This condition should neve arise
         let generator = new StarGenerator;

         if ( this.solverCfg.databasePath )
            generator.starDatabasePath = this.solverCfg.databasePath;
         generator.centerRA = metadata.ra;
         generator.centerDec = metadata.dec;
         if ( metadata.observationTime == null )
         {
            let epoch = new Date( Date.now() );
            generator.epoch = Math.complexTimeToJD( epoch.getFullYear(), epoch.getMonth()+1, epoch.getDate() );
         }
         else
            generator.epoch = metadata.observationTime;
         if ( this.solverCfg.projection != 0 )
            throw "The local catalog only supports the Gnomonic projection. Please select an online catalog.";
         generator.projectionSystem = StarGenerator.prototype.Gnomonic;

         if ( metadata.useFocal )
         {
            generator.focalLength = metadata.focal;
            generator.pixelSize = metadata.xpixsz;
            metadata.resolution = metadata.ResolutionFromFocal( metadata.focal );
         }
         else
         {
            if ( metadata.xpixsz > 0 )
            {
               generator.focalLength = metadata.FocalFromResolution( metadata.resolution );
               generator.pixelSize = metadata.xpixsz;
            }
            else
            {
               generator.pixelSize = 10;
               generator.focalLength = generator.pixelSize/metadata.resolution*0.18/Math.PI;
            }
         }

         generator.limitMagnitude = this.limitMagnitude;
         generator.outputMode = StarGenerator.prototype.Output_CSVFile;
         generator.outputFilePath = STAR_CSV_FILE;
         generator.sensorWidth = templateGeom.width;
         generator.sensorHeight = templateGeom.height;
         if ( !generator.executeGlobal() )
            throw "There was a problem reading the local catalog";
      }
      else
      {
         if ( !this.catalog )
            if ( this.solverCfg.catalogMode == 0 )
            {
               this.catalog = new CustomCatalog();
               this.catalog.catalogPath = this.solverCfg.databasePath;
            }
            else
            {
               this.catalog = __catalogRegister__.GetCatalog( this.catalogName );
               this.catalog.magMax = this.limitMagnitude;
            }

         this.catalog.Load( metadata, this.solverCfg.vizierServer );
         if ( this.catalog.objects == null )
            throw "Catalog error";

         let ref_G_S = templateGeom.ref_S_G.inverse();

         let file = new File;
         file.createForWriting( STAR_CSV_FILE );
         file.outTextLn( templateGeom.width + "," + templateGeom.height );
         let elements = this.catalog.objects;
         let numStars = 0;
         let clipRectS = templateGeom.clipRectS || new Rect(0, 0, templateGeom.width, templateGeom.height);

         for ( let i = 0; i < elements.length; ++i )
            if ( elements[i] )
            {
               let flux = (elements [i].magnitude == null) ? 0 : Math.pow( 2.512, -1.5 - elements[i].magnitude );
               let pos_G = templateGeom.projection.Direct( elements [i].posRD );
               if ( pos_G )
               {
                  let pos_S = ref_G_S.Apply( templateGeom.projection.Direct( elements[i].posRD ) );
                  if ( pos_S.x > clipRectS.left && pos_S.x < clipRectS.right && pos_S.y > clipRectS.top && pos_S.y < clipRectS.bottom )
                  {
                     file.outTextLn( format( "%f,%f,%g", pos_S.x, pos_S.y, flux ) );
                     numStars++;
                  }
               }
            }

         file.close();
         if ( numStars < 8 )
            throw "Found too few stars in the catalog. The magnitude filter could be too strict or the catalog server could be malfunctioning";
      }
   };

   this.DoIterationSA = function( window, metadata )
   {
      console.writeln("Starting StarAlignment iteration");

      try
      {
         // Render a star field around the original coordinates
         let templateSize = Math.max( metadata.width, metadata.height );
         let templateGeom = {
            ref_S_G: new Matrix(
            -metadata.resolution,  0,                   metadata.resolution*templateSize/2,
             0,                   -metadata.resolution, metadata.resolution*templateSize/2,
             0,                    0,                   1 ),

            projection: ProjectionFactory( this.solverCfg, metadata.ra, metadata.dec ),
            width: templateSize,
            height: templateSize,
            clipRectS: null
         };
         let pairs = null;
         if ( this.solverCfg.distortionCorrection && this.solverCfg.distortedCorners )
         {
            // Align the image
            this.GenerateTemplate( metadata, templateGeom );
            let centerPairs = this.DoAlign( window, null );

            // Get simplified solution for the image
            let pG = centerPairs.pS.map( p => templateGeom.ref_S_G.Apply( p ) );
            let ref_S_G = MultipleLinearRegression( 1, centerPairs.pI, pG ).ToLinealMatrix();
            let centerRD = templateGeom.projection.Inverse( ref_S_G.Apply( new Point( metadata.width/2, metadata.height/2 ) ) );
            let newProjection = ProjectionFactory( this.solverCfg, centerRD.x, centerRD.y );
            let pG2 = pG.map( p => newProjection.Direct( templateGeom.projection.Inverse( p ) ) );
            templateGeom.projection = newProjection;
            templateGeom.ref_S_G = MultipleLinearRegression( 1, centerPairs.pI, pG2 ).ToLinealMatrix();
            console.writeln( "Estimated image center: RA=", DMSangle.FromAngle( centerRD.x/15 ).ToString( true ),
                             "  Dec=", DMSangle.FromAngle( centerRD.y ).ToString() );

            // Generate the pairs for all the cells using the geometry of the center cell
            pairs = { pS: [], pI: [], pG: null };
            const cornerSize = 0.25;
            let seps = [0, cornerSize, 1-cornerSize, 1];
            for ( let cellIdx = 0; cellIdx < 9; cellIdx++ )
            {
               if ( console.abortRequested )
                  throw "Abort requested";
               let x = cellIdx % 3;
               let y = Math.floor( cellIdx/3 );
               let cellName = ["top", "center", "bottom"][y] + '-' + ["left", "center", "right"][x];
               console.writeln( '-'.repeat( 16 ) );
               console.writeln( "Aligning " + cellName + " cell" );
               templateGeom.clipRectS = new Rect( seps[x]*metadata.width,
                                                  seps[y]*metadata.height,
                                                  seps[x+1]*metadata.width,
                                                  seps[y+1]*metadata.height );
               this.GenerateTemplate( metadata, templateGeom );
               try
               {
                  let cellPairs = this.DoAlign( window, templateGeom.clipRectS );
                  pairs.pS = pairs.pS.concat( cellPairs.pS );
                  pairs.pI = pairs.pI.concat( cellPairs.pI );
               }
               catch ( ex )
               {
                  console.warningln( "Warning: Unable to align " + cellName + " cell." );
               }
            }
            pairs.pG = pairs.pS.map( p => templateGeom.ref_S_G.Apply( p ) );
         }
         else
         {
            this.GenerateTemplate( metadata, templateGeom );
            pairs = this.DoAlign( window, null );

            // Adjust to a projection with origin at the center of the image
            let pG = pairs.pS.map( p => templateGeom.ref_S_G.Apply( p ) );
            let ref_S_G = MultipleLinearRegression( 1, pairs.pI, pG ).ToLinealMatrix();
            let centerRD = templateGeom.projection.Inverse( ref_S_G.Apply( new Point( metadata.width/2, metadata.height/2 ) ) );
            let newProjection = ProjectionFactory( this.solverCfg, centerRD.x, centerRD.y );
            pairs.pG = pG.map( p => newProjection.Direct( templateGeom.projection.Inverse( p ) ) );
            templateGeom.projection = newProjection;
         }

         let newMetadata = metadata.Clone();
         newMetadata.projection = templateGeom.projection;
         if ( this.distortionModel )
            this.MetadataFromDistortionModel( newMetadata, pairs.pI, pairs.pG, null );
         else if ( this.solverCfg.distortionCorrection )
         {
            newMetadata.ref_I_G_lineal = MultipleLinearRegression( 1, pairs.pI, pairs.pG ).ToLinealMatrix();
            newMetadata.ref_I_G = new ReferSpline( pairs.pI, pairs.pG, null, 2,
                                                   this.solverCfg.splineSmoothing,
                                                   this.solverCfg.enableSimplifier,
                                                   this.solverCfg.simplifierTolerance,
                                                   this.solverCfg.simplifierRejectFraction );
            processEvents();
            newMetadata.ref_G_I = new ReferSpline( pairs.pG, pairs.pI, null, 2,
                                                   this.solverCfg.splineSmoothing,
                                                   this.solverCfg.enableSimplifier,
                                                   this.solverCfg.simplifierTolerance,
                                                   this.solverCfg.simplifierRejectFraction );
            processEvents();

            newMetadata.controlPoints = {
               pI: pairs.pI,
               pG: pairs.pG
            };
         }
         else
         {
            newMetadata.ref_I_G = MultipleLinearRegression( 1, pairs.pI, pairs.pG );
            newMetadata.ref_I_G_lineal = newMetadata.ref_I_G.ToLinealMatrix();
            newMetadata.ref_G_I = newMetadata.ref_I_G_lineal.inverse();
            newMetadata.controlPoints = null;
         }

         // Find the celestial coordinates (RD) of the center of the original image
         // First transform from I to G and then unprojects the gnomonic coords (G) to celestial (RD)
         let centerI = new Point( metadata.width/2, metadata.height/2 );
         let centerG = newMetadata.ref_I_G.Apply( centerI );
         //newMetadata.ref_I_G_lineal = MultipleLinearRegressionHelmert( pairs.pI, pG, centerI, centerG );

         let centerRD = newMetadata.projection.Inverse( centerG );
         if ( centerRD.x < 0 )
            centerRD.x += 360;
         else if ( centerRD.x > 360 )
            centerRD.x -= 360;
         newMetadata.ra = centerRD.x;
         newMetadata.dec = centerRD.y;
         let ref = newMetadata.ref_I_G_lineal;
         let resx = Math.sqrt( ref.at( 0, 0 )*ref.at( 0, 0 ) + ref.at( 0, 1 )*ref.at( 0, 1 ) );
         let resy = Math.sqrt( ref.at( 1, 0 )*ref.at( 1, 0 ) + ref.at( 1, 1 )*ref.at( 1, 1 ) );
         newMetadata.resolution = (resx + resy)/2;
         newMetadata.focal = newMetadata.FocalFromResolution( newMetadata.resolution );
         newMetadata.useFocal = false;

         return newMetadata;
      }
      catch ( ex )
      {
         console.criticalln( "*** Error: ", ex );
         console.writeln( "<html>Please check the following items:<ul>" +
            "<li>The initial coordinates should be inside the image.</li>" +
            "<li>The initial resolution should be within a factor of 2 from the correct value.</li>" +
            "<li>Adjust the star detection sensitivity parameter, so that the script can detect most of the stars in " +
               "the image without mistaking noise for stars.</li>" +
            "<li>The catalog should be matched to the image. Choose the appropriate catalog and magnitude filter, so " +
               "that the number of stars extracted from the catalog can be similar to the number of stars detected in the image.</li>" +
            "</ul></html>" );
         return null;
      }
      finally
      {
         if ( File.exists( STAR_CSV_FILE ) )
            File.remove( STAR_CSV_FILE );
      }
   };

   this.MetadataFromDistortionModel = function( newMetadata, pI, pG, weights )
   {
      let starsU = [];
      for ( let i = 0; i < pI.length; ++i )
      {
         let pointU = null;
         if ( pI[i] )
         {
            let offset = this.distortModel.ref_D_offset.Apply( pI[i] );
            pointU = new Point( pI[i].x - offset.x, pI[i].y - offset.y );
         }
         starsU.push( pointU );
      }

      let ref_U_G = MultipleLinearRegression( 1, starsU, pG ).ToLinealMatrix();

      let cpG = [];
      for ( let i = 0; i < this.distortModel.pU.length; ++i )
         cpG.push( ref_U_G.Apply( this.distortModel.pU[i] ) );

      newMetadata.ref_I_G = new ReferSpline( this.distortModel.pD, cpG, null, 2, 0, false/*simplify*/ );
      newMetadata.ref_I_G_lineal = MultipleLinearRegression( 1, this.distortModel.pD, cpG ).ToLinealMatrix();
      processEvents();
      newMetadata.ref_G_I = new ReferSpline( cpG, this.distortModel.pD, null, 2, 0, false/*simplify*/ );
      processEvents();
      newMetadata.controlPoints = {
         pI:      this.distortModel.pD,
         pG:      cpG,
         weights: null
      };
   };

   this.LoadDistortionModel = function( path )
   {
      let lines = File.readLines( path );
      if ( lines == null || lines.length < 1 )
         throw "Could not read the distortion model";

      let pD = [];
      let pU = [];
      let offset = [];
      for ( let i = 1; i < lines.length; ++i )
      {
         let tokens = lines[i].split( "," );
         if ( tokens == null || tokens.length != 4 )
            continue;
         pD.push( new Point( parseFloat( tokens[0] ), parseFloat( tokens[1] ) ) );
         pU.push( new Point( parseFloat( tokens[0] ) - parseFloat( tokens[2] ),
                             parseFloat( tokens[1] ) - parseFloat( tokens[3] ) ) );
         offset.push( new Point( parseFloat( tokens[2] ), parseFloat( tokens[3] ) ) );
      }
      return {
         pD:           pD,
         pU:           pU,
         ref_D_U:      new ReferSpline( pD, pU, null, 2, 0, false/*simplify*/ ),
         ref_U_D:      new ReferSpline( pU, pD, null, 2, 0, false/*simplify*/ ),
         ref_D_offset: new ReferSpline( pD, offset, null, 2, 0, false/*simplify*/ )
      };
   };

   this.FindStarsInImage = function( window, predictedCoords, tolerance )
   {
      console.writeln( "Fit known stars" )
      let DPSF = new DynamicPSF;
      DPSF.views = [
         // id
         [window.mainView.id]
      ];

      let searchRadius = 2;
      let stars = [];
      let psf = [];
      for ( let i = 0; i < predictedCoords.length; ++i )
      {
         //let pI = new Point( predictedCoords[i].x + Math.random()*6 - 3,
         //                    predictedCoords[i].y + Math.random()*6 - 3 );
         let pI = predictedCoords[i];

         stars.push( [ 0, 0, DynamicPSF.prototype.Star_DetectedOk,
                       pI.x - searchRadius, pI.y - searchRadius,
                       pI.x + searchRadius, pI.y + searchRadius,
                       pI.x, pI.y ] );
      }
      DPSF.stars = stars;
      DPSF.astrometry = false;
      DPSF.autoAperture = true;
      DPSF.searchRadius = searchRadius;
      DPSF.autoPSF = false;
      DPSF.gaussianPSF = true;
      DPSF.circularPSF = false;
      DPSF.moffatPSF = DPSF.moffat10PSF = DPSF.moffat8PSF =
         DPSF.moffat6PSF = DPSF.moffat4PSF = DPSF.moffat25PSF =
         DPSF.moffat15PSF = DPSF.lorentzianPSF = false;
      //console.writeln(DPSF.toSource());
      let res = DPSF.executeGlobal();
      psf = DPSF.psf;

      let imageStats = new ImageStatistics( window.mainView.image );
      const stdDev = imageStats.stdDev;
      let actualCoords = Array( predictedCoords.length );
      let valid = 0;
      for ( let i = 0; i < psf.length; ++i )
      {
         if ( psf[i][3] == DynamicPSF.prototype.PSF_FittedOk)
         {
            let B = psf[i][4];
            let A = psf[i][5];
            if ( A > B + stdDev*1 ) // Reject low SNR stars
            {
               actualCoords[psf[i][0]] = new Point( psf[i][6], psf[i][7] );
               valid++;
            }
         }
      }
      console.writeln( "Valid fittings: ", valid );

      return actualCoords;
   };

   this.DrawErrors = function( targetWindow, metadata, stars )
   {
      if ( !stars )
         return;
      console.writeln( "Generating error map" );
      if ( metadata.width*metadata.height*4 >= 2*1024*1024*1024 )
      {
         console.warningln( "** Warning: Cannot draw the image: The size is too big!" );
         return;
      }

      // Draw errors in a new bitmap
      let bmp = new Bitmap(metadata.width, metadata.height);

      //Copy the source image to the error image
      let imageOrg = targetWindow.mainView.image;
      let tmpW = new ImageWindow( metadata.width, metadata.height, imageOrg.numberOfChannels,
                                  targetWindow.bitsPerSample, targetWindow.isFloatSample,
                                  imageOrg.isColor,
                                  targetWindow.mainView.id +  "_Errors" );
      tmpW.mainView.beginProcess( UndoFlag_NoSwapFile );
      tmpW.mainView.image.apply( imageOrg );
      ApplySTF( tmpW.mainView, targetWindow.mainView.stf );
      tmpW.mainView.endProcess();
      bmp.assign( tmpW.mainView.image.render() );
      tmpW.forceClose();

      let g = new VectorGraphics( bmp );
      g.antialiasing = true;
      let linePen = new Pen( 0xffff4040, 1 );
      let starPen = new Pen( 0xff40ff40, 1 );
      let badStarPen = new Pen( 0xffff4040, 1 );
      for ( let i = 0; i < stars.actualCoords.length; ++i )
      {
         let predicted = metadata.Convert_RD_I( stars.starCoords[i] );
         if ( predicted )
         {
            if ( stars.actualCoords[i] )
            {
               let arrow = new Point( predicted.x + (stars.actualCoords[i].x - predicted.x)*1,
                                      predicted.y + (stars.actualCoords[i].y - predicted.y)*1 );
               g.pen = linePen;
               g.drawLine( predicted, arrow );
               g.pen = starPen;
            }
            else
               g.pen = badStarPen;

            g.drawLine( predicted.x-10, predicted.y,    predicted.x-5, predicted.y );
            g.drawLine( predicted.x+10, predicted.y,    predicted.x+5, predicted.y );
            g.drawLine( predicted.x,    predicted.y-10, predicted.x,   predicted.y-5 );
            g.drawLine( predicted.x,    predicted.y+10, predicted.x,   predicted.y+5 );
         }
      }

      /* Debugging: Paint position of the control points
      if ( metadata.controlPoints )
      {
         g.pen = new Pen( 0xffffff00 );
         for( let i = 0; i < metadata.controlPoints.pI.length; ++i )
         {
            let pI = metadata.controlPoints.pI[i];
            if ( pI )
               g.strokeEllipse( pI.x-5, pI.y-5, pI.x+5, pI.y+5, g.pen );
         }
      }*/
      g.end();

      let errW = new ImageWindow( metadata.width, metadata.height,
                                  3, 8, false, true,
                                  targetWindow.mainView.id +  "_Errors" );
      errW.mainView.beginProcess( UndoFlag_NoSwapFile );
      // Blend annotation with target image
      errW.mainView.image.blend( bmp );
      // Copy keywords to target image
      errW.keywords = targetWindow.keywords;
      errW.mainView.endProcess();
      errW.show();
   };

   this.DrawSimplifiedSurface = function( targetWindow, metadata, S, suffix )
   {
      let bmp = new Bitmap( metadata.width, metadata.height );
      bmp.fill( 0xffffffff );
      let g = new VectorGraphics( bmp );
      g.antialiasing = true;
      let linePen = new Pen( 0xff000000, 2 );
      g.pen = linePen;
      for ( let i = 0, n = S[0].length; i < n; ++i )
      {
         let p = new Point( S[0].at( i ), S[1].at( i ) );
         g.drawLine( p.x-10, p.y,    p.x+10, p.y );
         g.drawLine( p.x,    p.y-10, p.x,    p.y+10 );
      }
      g.end();

      let window = new ImageWindow( metadata.width, metadata.height,
                                    3, 8, false, true, targetWindow.mainView.id + suffix + "_simplified" );
      window.mainView.beginProcess( UndoFlag_NoSwapFile );
      window.mainView.image.blend( bmp );
      window.mainView.endProcess();
      window.show();
   };

   this.DrawSimplifiedSurfaces = function( targetWindow, metadata )
   {
      console.writeln( "Generating simplified surface maps" );
      if ( metadata.width*metadata.height*4 >= 2*1024*1024*1024 )
      {
         console.warningln( "** Warning: Cannot draw the image: The size is too big!" );
         return;
      }

      if ( !metadata.ref_I_G.simpleX || !metadata.ref_I_G.simpleY )
      {
         console.warningln( "** Warning: Internal error: No simplified surfaces available." );
         return;
      }

      this.DrawSimplifiedSurface( targetWindow, metadata, metadata.ref_I_G.simpleX, "_I_G_X" );
      this.DrawSimplifiedSurface( targetWindow, metadata, metadata.ref_I_G.simpleY, "_I_G_Y" );
   };

   this.DrawDistortions = function( targetWindow, metadata )
   {
      console.writeln( "Generating distortion map" );
      if ( metadata.width*metadata.height*4 >= 2*1024*1024*1024 )
      {
         console.warningln( "** Warning: Cannot draw the image: The size is too big!" );
         return;
      }

      let ref_I_G_lineal = metadata.ref_I_G_lineal;
      if ( metadata.controlPoints )
      {
         let centerI = new Point( metadata.width/2, metadata.height/2 );
         let centerG = metadata.ref_I_G.Apply( centerI );
         ref_I_G_lineal = MultipleLinearRegressionHelmert( metadata.controlPoints.pI, metadata.controlPoints.pG, centerI, centerG );
      }

      // Draw errors in a new bitmap
      let bmp = new Bitmap( metadata.width, metadata.height );

      bmp.fill( 0xffffffff );
      let g = new VectorGraphics( bmp );
      g.antialiasing = true;
      let linePen = new Pen( 0xff000000, 2 );
      let starPen = new Pen( 0xff800000, 2 );
      g.pen = starPen;
      let cellSize = Math.min( metadata.width, metadata.height )/40;
      cellSize = Math.max( 40, cellSize );

      let errorScale = 1;
      for ( let y = 0; y < metadata.height; y += cellSize )
         for ( let x = 0; x < metadata.width; x += cellSize )
         {
            let posLinealI = new Point( x + cellSize/2, y + cellSize/2 );
            let posG = ref_I_G_lineal.Apply( posLinealI );
            let posDistortI = metadata.ref_G_I.Apply( posG );
            if ( !posDistortI )
               continue;
            let arrow = new Point( posDistortI.x + (posLinealI.x - posDistortI.x)*errorScale,
                                   posDistortI.y + (posLinealI.y - posDistortI.y)*errorScale );
            g.drawLine( posDistortI, arrow );
            g.drawEllipse( posDistortI.x-1, posDistortI.y-1, posDistortI.x+1, posDistortI.y+1 );
         }
      g.pen = linePen;
      for ( let y = 0; y-cellSize <= metadata.height; y += cellSize )
      {
         let pts = [];
         for ( let x = 0; x-cellSize <= metadata.width; x += cellSize )
         {
            let posLinealI = new Point( x, y );
            let posG = ref_I_G_lineal.Apply( posLinealI );
            pts.push( metadata.ref_G_I.Apply( posG ) );
         }
         g.drawPolyline( pts );
      }
      for ( let x = 0; x-cellSize <= metadata.width; x += cellSize )
      {
         let pts = [];
         for ( let y = 0; y-cellSize <= metadata.height; y += cellSize )
         {
            let posLinealI = new Point( x, y );
            let posG = ref_I_G_lineal.Apply( posLinealI );
            pts.push( metadata.ref_G_I.Apply( posG ) );
         }
         g.drawPolyline( pts );
      }
      g.end();

      let errW = new ImageWindow( metadata.width, metadata.height,
                                  3, 8, false, true, targetWindow.mainView.id + "_Distortions" );
      errW.mainView.beginProcess( UndoFlag_NoSwapFile );
      // Blend annotation with target image
      errW.mainView.image.blend( bmp );
      // Copy keywords to target image
      errW.keywords = targetWindow.keywords;
      errW.mainView.endProcess();
      errW.show();
   };

   this.GenerateDistortionModel = function( metadata, path )
   {
      console.writeln( "Generating distortion model: ", path );

      let file = new File();
      try
      {
         file.create( path );
         file.outTextLn( "ThinPlate,2" );

         let ref_I_G_lineal = metadata.ref_I_G_lineal;
         if ( metadata.controlPoints )
         {
            let centerI = new Point( metadata.width/2, metadata.height/2 );
            let centerG = metadata.ref_I_G.Apply( centerI );
            ref_I_G_lineal = MultipleLinearRegressionHelmert( metadata.controlPoints.pI, metadata.controlPoints.pG, centerI, centerG );
         }

         for ( let y = 0; y <= 30; ++y )
            for( let x = 0; x <= 30; ++x )
            {
               let posLinealI = new Point( metadata.width/30*x, metadata.height/30*y );
               let posG = ref_I_G_lineal.Apply( posLinealI );
               let posDistortI = metadata.ref_G_I.Apply( posG );
               let dx = posDistortI.x - posLinealI.x;
               let dy = posDistortI.y - posLinealI.y;
               file.outTextLn( format( "%f,%f,%f,%f", posLinealI.x, posLinealI.y, dx, dy ) );
            }
      }
      finally
      {
         file.close();
      }
   };

   this.showedWarningOnTruncatedInputSet = false;

   this.DetectStars = function( window, metadata)
   {
      // Load stars
      let catalogObjects;
      if ( this.useStarGeneratorCatalog )
      {
         let templateSize = Math.max(metadata.width, metadata.height) * Math.sqrt(2);
         let generator = new StarGenerator;

         if ( this.solverCfg.databasePath )
            generator.starDatabasePath = this.solverCfg.databasePath;
         generator.centerRA = metadata.ra;
         generator.centerDec = metadata.dec;
         if ( metadata.observationTime == null )
         {
            let epoch = new Date( Date.now() );
            generator.epoch = Math.complexTimeToJD( epoch.getFullYear(), epoch.getMonth()+1, epoch.getDate() );
         }
         else
            generator.epoch = metadata.observationTime;
         generator.projectionSystem = StarGenerator.prototype.Gnomonic;
         generator.pixelSize = 10;
         generator.focalLength = generator.pixelSize/metadata.resolution*0.18/Math.PI;
         generator.limitMagnitude = this.limitMagnitude;
         generator.outputMode = StarGenerator.prototype.Output_CSVFile;
         generator.outputFilePath = STAR_CSV_FILE;
         generator.sensorWidth = templateSize;
         generator.sensorHeight = templateSize;
         generator.executeGlobal();

         let ref_S_G = new Matrix(
            -metadata.resolution, 0,                   metadata.resolution*templateSize/2,
            0,                   -metadata.resolution, metadata.resolution*templateSize/2,
            0,                    0,                   1 );

         let projection = new Gnomonic( 180/Math.PI, metadata.ra, metadata.dec );

         // Read the positions of the stars from the file written by StarGenerator
         let lines= File.readLines( STAR_CSV_FILE );
         catalogObjects = [];
         for ( let i = 0; i < lines.length; ++i )
         {
            //console.writeln( "Line: ", lines[i] );
            let tokens = lines[i].split( "," );
            if ( tokens.length != 3 )
               continue;

            let posS = new Point(parseFloat(tokens[0]), parseFloat(tokens[1]));
            let posG = ref_S_G.Apply(posS);
            let posRD = projection.Inverse(posG);
            let flux = parseFloat(tokens[2]);
            let mag = -1.5-2.5*Math.log10(flux);
            catalogObjects.push({posRD:posRD, magnitude:mag});
         }
      }
      else
      {
         if ( !this.catalog )
            if ( this.solverCfg.catalogMode == 0 )
            {
               this.catalog = new CustomCatalog;
               this.catalog.catalogPath = this.solverCfg.databasePath;
            }
            else
            {
               this.catalog = __catalogRegister__.GetCatalog( this.catalogName );
               this.catalog.magMax = this.limitMagnitude;
            }
         this.catalog.Load( metadata, this.solverCfg.vizierServer );
         catalogObjects = this.catalog.objects;
      }
      if ( catalogObjects == null )
         throw "Catalog error";
      if ( catalogObjects.length < 10 )
         throw "The solver has found too few stars in the catalog";
      catalogObjects.sort( function( a, b )
                           {
                              if ( a.magnitude && b.magnitude )
                                 return a.magnitude - b.magnitude;
                              if ( a.magnitude )
                                 return 1;
                              return b.magnitude ? -1 : 0;
                           } );

      // Create the arrays starCoords, coordsG and predictedCoords
      let result = { projection: null, starCoords:[], coordsG:[], magnitudes:[], actualCoords:null };
      let predictedCoords = []; // Pixel coordinates of the catalog stars obtained using the current referentiation
      //result.projection = new Gnomonic( 180/Math.PI, metadata.ra, metadata.dec ); // New projection using the new center
      result.projection = ProjectionFactory( this.solverCfg, metadata.ra, metadata.dec );
      if ( catalogObjects.length > WCS_MAX_STARS_IN_SOLUTION )
         if ( !this.showedWarningOnTruncatedInputSet )
         {
            console.warningln( "<end><cbr>** Warning: Exceeded the maximum number of stars allowed. " +
                               "Truncating the input set to the ", WCS_MAX_STARS_IN_SOLUTION, " brightest stars." );
            this.showedWarningOnTruncatedInputSet = true;
         }

      for ( let i = 0, n = Math.min( WCS_MAX_STARS_IN_SOLUTION, catalogObjects.length ); i < n; ++i )
         if ( catalogObjects[i] )
         {
            let posI = metadata.Convert_RD_I( catalogObjects[i].posRD );
            if ( posI
              && posI.x >= 0
              && posI.y >= 0
              && posI.x <= metadata.width
              && posI.y <= metadata.height )
            {
               predictedCoords.push( posI );
               result.coordsG.push( result.projection.Direct( catalogObjects[i].posRD ) );
               result.starCoords.push( catalogObjects[i].posRD );
               result.magnitudes.push( catalogObjects[i].magnitude );
               //console.writeln( catalogObjects[i].magnitude );
            }
         }

      // Find the stars in the image using predictedCoords as starting point
      let tolerance = 8//this.solverCfg.distortionCorrection ? 20 : 8;
      result.actualCoords = this.FindStarsInImage( window, predictedCoords, tolerance );
      //result.actualCoords = predictedCoords; // TEMPORAL - DEBUG

      // Remove control points with the same coordinates
      for ( let i = 0; i < result.actualCoords.length; ++i )
      {
         if ( !result.actualCoords[i] )
            continue;
         for ( let j = 0; j < i; ++j )
         {
            if ( !result.actualCoords[j] )
               continue;
            if ( (result.actualCoords[i].x == result.actualCoords[j].x && result.actualCoords[i].y == result.actualCoords[j].y)
               || (result.coordsG[i].x == result.coordsG[j].x && result.coordsG[i].y == result.coordsG[j].y) )
            {
               result.actualCoords[i] = null;
               result.coordsG[i] = null;
               break;
            }
         }
      }

      // Calculate errors
      result.errors2 = Array( predictedCoords.length );
      let stddev2 = 0;
      let numFitted = 0;
      for ( let i = 0; i < predictedCoords.length; ++i )
         if ( result.actualCoords[i] )
         {
            let errx = predictedCoords[i].x - result.actualCoords[i].x;
            let erry = predictedCoords[i].y - result.actualCoords[i].y;
            let err2 = errx*errx + erry*erry;
            stddev2 += err2;
            result.errors2[i] = err2;
            numFitted++;
         }
      stddev2 /= numFitted;

      // Remove stars with too high error (>3*sigma)
      let sum = 0;
      let nsigma = 3;
      let nsigma2 = nsigma * nsigma;
      let maxTolerance = tolerance * tolerance;
      result.numValid = 0;
      result.numRejected = 0;
      console.writeln( format( "Error StdDev = %.2f px", Math.sqrt( stddev2 ) ) );
      let tolerance2 = Math.min( stddev2 * nsigma2, maxTolerance );
      console.writeln( format( "Tolerance for rejecting stars: %.2f px", Math.sqrt( tolerance2 ) ) );
      for ( let i = 0; i < predictedCoords.length; ++i )
         if ( result.actualCoords[i] )
            if ( result.errors2[i] > tolerance2 )
            {
               result.actualCoords[i] = null;
               result.numRejected++;
            }
            else
            {
               sum += result.errors2[i];
               result.numValid++;
            }

      if ( result.numValid > 0 )
         result.rms = Math.sqrt( sum/result.numValid );

      this.CalculateSplineWeights( metadata, result, tolerance2 );

      console.writeln( "Stars: ", result.numValid, " valid, ", result.numRejected, " rejected." );

      result.score = result.numValid * 2 / (1 + result.rms);

      return result;
   };

   this.CalculateSplineWeights = function( metadata, stars, tolerance2 )
   {
      stars.weights = new Array( stars.length );
      let maxRadius = Math.sqrt( metadata.width*metadata.width + metadata.height*metadata.height )/2;
      for ( let i = 0; i < stars.actualCoords.length; ++i )
      {
         if ( !stars.actualCoords[i] )
            continue;
         let dx = stars.actualCoords[i].x - metadata.width/2;
         let dy = stars.actualCoords[i].y - metadata.height/2;
         let radius = Math.sqrt( dx*dx + dy*dy )/maxRadius;
         let radiusWeight = radius*radius*0.75 + 0.25;
         //let errorWeight = 1/(Math.sqrt( stars.errors2[i] ) + 1); // 1 - stars.errors2[i]/tolerance2;
         //let errorWeight = Math.sqrt( stars.errors2[i] ) + 1; // 1 - stars.errors2[i]/tolerance2;
         //stars.weights[i] = Math.sqrt( radiusWeight*errorWeight );
         stars.weights[i] = radiusWeight; // * errorWeight;
         //stars.weights[i] = errorWeight;// * stars.magnitudes[i];
      }
   };

   this.GetDistortion = function( metadata )
   {
      let incx = (metadata.width - 0.01)/Math.round( metadata.width/20 );
      let incy = (metadata.height - 0.01)/Math.round( metadata.height/20 );
      let pD = []; // DistortedCoords
      let pL = []; // LinearCoords
      let ref_G_I_lineal = metadata.ref_I_G_lineal.inverse();
      for ( let y = 0; y <= metadata.height; y += incy )
         for ( let x = 0; x <= metadata.width; x += incx )
         {
            let p = new Point( x, y );
            let pG = metadata.ref_I_G.Apply( p );
            let pLineal = ref_G_I_lineal.Apply( pG );
            pD.push( p );
            pL.push( pLineal );
         }
      console.writeln("nump: ", pD.length);
      let distortion = { ref_D_L: MultipleLinearRegression( metadata.ref_I_G.polDegree, pD, pL ),
                         ref_L_D: MultipleLinearRegression( metadata.ref_I_G.polDegree, pL, pD ) };
      console.writeln( distortion.ref_D_L.toString() );
      console.writeln( distortion.ref_L_D.toString() );
      return distortion;
   };

   this.DoIterationLineal = function( metadata, stars )
   {
      console.writeln( "Starting Linear iteration." );
      console.flush();
      processEvents();

      // Find referentiation matrices
      let newMetadata = metadata.Clone();
      newMetadata.projection = stars.projection;
      newMetadata.ref_I_G = MultipleLinearRegression( 1, stars.actualCoords, stars.coordsG ).ToLinealMatrix();
      newMetadata.ref_I_G_lineal = newMetadata.ref_I_G;
      newMetadata.ref_G_I = newMetadata.ref_I_G.inverse();
      newMetadata.controlPoints = null;

      // Find the celestial coordinates (RD) of the center of the original image
      // First transform from I to G and then unprojects the gnomonic coords (G) to celestial (RD)
      let centerI = new Point( metadata.width/2, metadata.height/2 );
      let centerG = newMetadata.ref_I_G.Apply( centerI );
      //newMetadata.ref_I_G_lineal = MultipleLinearRegressionHelmert( stars.actualCoords, stars.coordsG, centerI, centerG );
      let centerRD = newMetadata.projection.Inverse( centerG );
      while ( centerRD.x < 0 )
         centerRD.x += 360;
      while ( centerRD.x > 360 )
         centerRD.x -= 360;
      newMetadata.ra = (Math.abs( metadata.ra-centerRD.x ) < 1) ? (metadata.ra + centerRD.x*2)/3: centerRD.x;
      newMetadata.dec = (Math.abs(metadata.dec-centerRD.y) < 1) ? (metadata.dec + centerRD.y*2)/3: centerRD.y;
      let ref = newMetadata.ref_I_G_lineal;
      let resx = Math.sqrt( ref.at( 0, 0 )*ref.at( 0, 0 ) + ref.at( 0, 1 )*ref.at( 0, 1 ) );
      let resy = Math.sqrt( ref.at( 1, 0 )*ref.at( 1, 0 ) + ref.at( 1, 1 )*ref.at( 1, 1 ) );
      newMetadata.resolution = (resx + resy)/2;
      newMetadata.focal = newMetadata.FocalFromResolution( newMetadata.resolution );
      newMetadata.useFocal = false;

      return newMetadata;
   };

   this.DoIterationSpline = function( metadata, stars )
   {
      // Find referentiation matrices
      let newMetadata = metadata.Clone();
      newMetadata.projection = stars.projection;
      if ( this.distortModel != null )
      {
         console.writeln( "Starting spline iteration with distortion model." );
         console.flush();
         processEvents();
         this.MetadataFromDistortionModel( newMetadata, stars.actualCoords, stars.coordsG, stars.weights );
      }
      else
      {
         console.writeln( "Starting spline iteration." );
         console.flush();
         processEvents();
         newMetadata.ref_I_G = new ReferSpline( stars.actualCoords, stars.coordsG, stars.weights, 2,
                                                this.solverCfg.splineSmoothing,
                                                this.solverCfg.enableSimplifier,
                                                this.solverCfg.simplifierTolerance,
                                                this.solverCfg.simplifierRejectFraction );
         newMetadata.ref_I_G_lineal = MultipleLinearRegression( 1, stars.actualCoords, stars.coordsG ).ToLinealMatrix();
         processEvents();
         newMetadata.ref_G_I = new ReferSpline( stars.coordsG, stars.actualCoords, stars.weights, 2,
                                                this.solverCfg.splineSmoothing,
                                                this.solverCfg.enableSimplifier,
                                                this.solverCfg.simplifierTolerance,
                                                this.solverCfg.simplifierRejectFraction );
         processEvents();

         newMetadata.controlPoints = {
            pI: stars.actualCoords,
            pG: stars.coordsG,
            weights: stars.weights
         };
      }

      // Find the celestial coordinates (RD) of the center of the original image
      // First transform from I to G and then unprojects the gnomonic coords (G) to celestial (RD)
      let centerI = new Point( metadata.width/2, metadata.height/2 );
      let centerG = newMetadata.ref_I_G.Apply( centerI );
      //newMetadata.ref_I_G_lineal = MultipleLinearRegressionHelmert( stars.actualCoords, stars.coordsG, centerI, centerG );
      let centerRD = newMetadata.projection.Inverse( centerG );
      while ( centerRD.x < 0 )
         centerRD.x += 360;
      while ( centerRD.x > 360 )
         centerRD.x -= 360;
      newMetadata.ra = (Math.abs( metadata.ra-centerRD.x) < 1) ? (metadata.ra + centerRD.x*2)/3: centerRD.x;
      newMetadata.dec = (Math.abs( metadata.dec-centerRD.y) < 1) ? (metadata.dec + centerRD.y*2)/3: centerRD.y;
      let ref = newMetadata.ref_I_G_lineal;
      let resx = Math.sqrt( ref.at( 0, 0 )*ref.at( 0, 0 ) + ref.at( 0, 1 )*ref.at( 0, 1 ) );
      let resy = Math.sqrt( ref.at( 1, 0 )*ref.at( 1, 0 ) + ref.at( 1, 1 )*ref.at( 1, 1 ) );
      newMetadata.resolution = (resx + resy)/2;
      newMetadata.focal = newMetadata.FocalFromResolution( newMetadata.resolution );
      newMetadata.useFocal = false;

      return newMetadata;
   };

   this.GenerateWorkingImage = function( targetWindow )
   {
      // Convert the image to grayscale.
      // The chrominance is not necessary for the astrometry.
      let grayscaleImage = new Image;
      grayscaleImage.assign( targetWindow.mainView.image );
      grayscaleImage.colorSpace = ColorSpace_HSI;
      grayscaleImage.selectedChannel = 2; // intensity component

      let workingWindow = new ImageWindow(
         grayscaleImage.width, grayscaleImage.height, 1,
         32/*bitsPerSample*/,
         true/*floatSample*/,
         false/*isColor*/,
         targetWindow.mainView.id + "_working" );
      workingWindow.mainView.beginProcess( UndoFlag_NoSwapFile) ;
      workingWindow.mainView.image.apply( grayscaleImage );
      workingWindow.mainView.endProcess();

      // Apply noise reduction if requested
      if (this.solverCfg.noiseLayers > 0) {
         let wavelets = new MultiscaleLinearTransform;
         let layers = [];
         for ( let i = 0; i < this.solverCfg.noiseLayers; ++i )
            layers.push( [false, true, 0.000, false, 3.000, 1.00, 1] );
         layers.push( [true, true, 0.000, false, 3.000, 1.00, 1] );
         wavelets.layers = layers;
         wavelets.transform = MultiscaleLinearTransform.prototype.StarletTransform;
         wavelets.executeOn( workingWindow.mainView, false/*swapFile*/ );
      }

      // Deallocate now, don't wait for garbage collection.
      grayscaleImage.free();

      return workingWindow;
   };

   this.CalculateMetadataDelta = function( metadata1, metadata2 )
   {
      // Calculate the difference between the last two iterations using the displacement of the center and one corner
      let cornerI = new Point( 0, 0 );
      let cornerRD2 = metadata2.Convert_I_RD( cornerI );
      let cornerRD1 = metadata1.ref_I_G ? metadata1.Convert_I_RD( cornerI ) : cornerRD2;
      let delta1 = 0;
      if ( cornerRD1 )
         delta1 = Math.sqrt( Math.pow( (cornerRD1.x - cornerRD2.x)*Math.cos( Math.rad( cornerRD2.y ) ), 2 ) +
                             Math.pow( (cornerRD1.y - cornerRD2.y), 2 ) )*3600;
      let delta2 = Math.sqrt( Math.pow( (metadata2.ra - metadata1.ra)*Math.cos( Math.rad( metadata2.dec ) ), 2 ) +
                              Math.pow( metadata2.dec - metadata1.dec, 2 ) )*3600;
      return Math.max( delta1, delta2 );
   };

   this.OptimizeSolution = function( workingWindow, currentMetadata, stars )
   {
      let finish = false;
      let iteration = 1;
      let lastImprovement = 0;
      let maxItersNoImprovement = this.solverCfg.distortionCorrection /*&& !this.distortModel*/ ? 4 : 2;

      let iterationHistory = [];
      iterationHistory.push( { score: stars.score, numValid: stars.numValid } );
      let bestMetadata = currentMetadata;
      let bestScore = stars.score;

      while ( !finish )
      {
         console.abortEnabled = true;

         let result;
         try
         {
            if ( this.solverCfg.distortionCorrection )
               result = this.DoIterationSpline( currentMetadata, stars );
            else
               result = this.DoIterationLineal( currentMetadata, stars );
            if ( result == null )
            {
               console.warningln( "** Warning: The image could not be fully solved. " +
                                  "The image has been tagged with the latest good solution." );
               break;
            }
         }
         catch( ex )
         {
            console.abortEnabled = false;
            console.warningln( "** Warning: The image could not be fully solved: " + ex +
                               "\nThe image has been tagged with the latest known good solution." );
            break;
         }

         stars = this.DetectStars( workingWindow, result );

         // Calculate the difference between the last two iterations using the displacement of the center and one corner
         let delta = this.CalculateMetadataDelta( currentMetadata, result );

         // Show iteration info
         console.writeln( "<end><cbr><br>*****" );
         console.writeln( format( "Iteration %d, delta = %.3f as (%.2f px)", iteration, delta, delta/(result.resolution*3600) ) );
         console.writeln( "Image center ...... RA: ", DMSangle.FromAngle( result.ra/15 ).ToString( true ),
            "  Dec: ", DMSangle.FromAngle( result.dec ).ToString() );
         console.writeln( format( "Resolution ........ %.2f as/px", result.resolution*3600 ) );
         console.writeln( format( "RMS ............... %.4f px (%d stars)", stars.rms, stars.numValid ) );
         if (stars.score > bestScore * 1.001)
            console.writeln( format( "Score ............. \x1b[38;2;128;255;128m%.4f\x1b[0m", stars.score ) );
         else
            console.writeln( format( "Score ............. %.4f", stars.score ) );
         console.writeln( "*****" );
         currentMetadata = result;

         iterationHistory.push( {score: stars.score, numValid: stars.numValid} );

         if ( stars.score > bestScore )
         {
            if ( stars.score > bestScore*1.001 )
               lastImprovement = 0;
            else
               lastImprovement++;
            bestMetadata = result;
            bestScore = stars.score;
         }
         else
            lastImprovement++;

         if ( this.distortModel && lastImprovement > 2 )
         {
            lastImprovement = 0;
            this.distortModel = null;
            console.noteln( "* The solution with distortion model has converged. Trying to optimize it without the model." );
         }

         // Finish condition
         finish = true;
         if ( iteration > this.solverCfg.maxIterations )
            console.warningln( "** Warning: Reached maximum number of iterations." );
         else if ( lastImprovement > maxItersNoImprovement )
            console.noteln( "* Reached maximum number of iterations without further improvement." );
         else
            finish = false;

         iteration++;
         this.solverCfg.showStars = false;

         console.abortEnabled = true;
         processEvents();
         if ( console.abortRequested )
         {
            finish = true;
            console.criticalln( "*** User requested abort ***" );
         }
         gc( true );
      }

      console.noteln( format( "* Successful astrometry optimization. Score = %.2f", bestScore ) );
      console.writeln();
      return bestMetadata;
   }

   this.SolveImage = function( targetWindow )
   {
      let abortableBackup = jsAbortable;
      jsAbortable = true;
      let auxWindow = null;
      this.error = null;
      try
      {
         console.show();
         console.abortEnabled = true;

         this.useStarGeneratorCatalog = this.solverCfg.catalogMode == 0 &&
                        File.extractExtension( this.solverCfg.databasePath ) == ".bin";

         if ( this.solverCfg.autoMagnitude || this.solverCfg.catalogMode == 2 )
         {
            let fov = this.metadata.resolution * Math.max( this.metadata.width, this.metadata.height );
            // Empiric formula for 1000 stars at 20 deg of galactic latitude
            let autoLimitMagnitudeFactor = 14.5;
            let m = autoLimitMagnitudeFactor * Math.pow( fov, -0.179 );
            m = Math.round( 100*Math.min( 20, Math.max( 7, m ) ) )/100;
            if ( this.solverCfg.autoMagnitude )
            {
               this.limitMagnitude = m;
               console.noteln( "<end><cbr>* Using an automatically calculated limit magnitude of " + format( "%.2f", m ) + "." );
            }
            else
               this.limitMagnitude = this.solverCfg.magnitude;

            if ( this.solverCfg.catalogMode == 2 )
            {
               if ( m <= 7 )
                  this.catalogName = "Bright Stars";
               else if ( fov > 3 )
                  this.catalogName = "TYCHO-2";
               else
                  this.catalogName = "GaiaDR2";
               console.noteln( "<end><cbr>* Using the automatically selected " + this.catalogName + " catalog." );
            }
            else
               this.catalogName = this.solverCfg.catalog;
         }
         else
         {
            this.limitMagnitude = this.solverCfg.magnitude;
            this.catalogName = this.solverCfg.catalog;
         }

         let workingWindow = targetWindow;
         if (this.solverCfg.noiseLayers > 0 || targetWindow.mainView.image.isColor)
            auxWindow = workingWindow = this.GenerateWorkingImage(targetWindow);

         console.writeln( "Seed parameters for plate solving:" );
         console.writeln( "   Image coordinates: RA = ",
            DMSangle.FromAngle( this.metadata.ra/15 ).ToString( true ), ", Dec = ",
            DMSangle.FromAngle( this.metadata.dec ).ToString());
         console.writeln( format( "   Resolution: %.3f as/px", this.metadata.resolution * 3600 ) );

         let stars = null;

         if ( this.solverCfg.distortionCorrection && this.solverCfg.useDistortionModel )
         {
            if ( this.solverCfg.distortionModelPath == null || this.solverCfg.distortionModelPath.length == 0 )
               throw "The distortion model path is empty";
            this.distortModel = this.LoadDistortionModel( this.solverCfg.distortionModelPath );
         }
         else
            this.distortModel = null;

         // Initial Alignment
         try {
            if (this.solverCfg.onlyOptimize) {
               this.metadata.ExtractMetadata(targetWindow);
            } else {
               let result = this.DoIterationSA(targetWindow, this.metadata);
               if (!result)
                  throw "Alignment failed";
               this.metadata = result;
            }

            stars = this.DetectStars(workingWindow, this.metadata);
         } catch (ex) {
            console.criticalln("*** Error: Unable to plate solve the image: " + ex);
            if (!this.solverCfg.onlyOptimize)
               console.writeln("This is usually because the initial parameters are too far from the real metadata of the image.");
            this.error = "Error solving the image: " + ex.toString();
            return false;
         }

         // Show iteration info
         console.writeln( "<end><cbr><br>*****" );
         console.writeln( "Iteration 0");
         console.writeln("Image center ... RA: ", DMSangle.FromAngle(this.metadata.ra / 15).ToString(true),
            "  Dec: ", DMSangle.FromAngle(this.metadata.dec).ToString());
         console.writeln(format("Resolution ..... %.2f as/px", this.metadata.resolution * 3600));
         console.writeln(format("RMS ............ %.4f px (%d stars)", stars.rms, stars.numValid));
         console.writeln(format("Score .......... %.4f", stars.score));
         console.writeln( "*****" );

         // Optimize the solution
         if(this.solverCfg.optimizeSolution || this.solverCfg.onlyOptimize)
            this.metadata = this.OptimizeSolution(workingWindow, this.metadata, stars);

         /*
          * N.B. This is no longer necessary with the use of SurfaceSimplifier.
          */
//          if ( this.solverCfg.distortionCorrection )
//          {
//             let optimizer = new OptimizeSplineCoordinates( this.metadata.width, this.metadata.height, this.metadata.ref_I_G, this.metadata.ref_G_I, 0.5 );
//             let res = optimizer.Optimize();
//             if ( !this.metadata.controlPoints || this.metadata.controlPoints.pI.length > res.controlPoints.pA.length )
//             {
//                this.metadata.ref_I_G = res.ref_A_B;
//                this.metadata.ref_G_I = res.ref_B_A;
//                this.metadata.controlPoints = {
//                   pI: res.controlPoints.pA,
//                   pG: res.controlPoints.pB };
//                console.writeln( format( "<end><cbr>Applying optimized spline with %d control points.", res.controlPoints.pA.length ) );
//             }
//          }

         // Set FITS keywords and regenerate solutions
         targetWindow.mainView.beginProcess( UndoFlag_Keywords|UndoFlag_AstrometricSolution );
         this.metadata.SaveKeywords( targetWindow, false/*beginProcess*/ );
         this.metadata.SaveProperties( targetWindow );
         targetWindow.regenerateAstrometricSolution();
         targetWindow.mainView.endProcess();

         // Distortion model
         if ( this.solverCfg.distortionCorrection && this.solverCfg.generateDistortModel )
         {
            let modelPath = null;
            let filePath = targetWindow.filePath;
            if ( filePath.length > 0 )
            {
               let modelDir = File.extractDrive( filePath )
                            + File.extractDirectory( filePath );
               let info = new FileInfo( modelDir );
               if ( info.isWritable )
               {
                  if ( !modelDir.endsWith( '/' ) )
                     modelDir += '/';
                  modelPath = modelDir
                            + File.extractName( filePath )
                            + "_model.csv";
               }
            }

            if ( modelPath == null )
            {
               let ofd = new SaveFileDialog;
               ofd.caption = "Save Distortion Model File";
               ofd.filters = [["Distortion models", "*.csv"]];
               if ( filePath.length > 0 )
                  ofd.initialPath = File.changeExtension( filePath, ".csv" );
               if ( ofd.execute() )
                  modelPath = ofd.fileName;
            }

            if ( modelPath != null )
               this.GenerateDistortionModel( this.metadata, modelPath );
         }

         /*
          * Control images
          */
         if ( this.solverCfg.distortionCorrection )
         {
            if ( this.solverCfg.showDistortion )
               this.DrawDistortions( targetWindow, this.metadata );

            if ( this.solverCfg.enableSimplifier )
               if ( this.solverCfg.showSimplifiedSurfaces )
                  this.DrawSimplifiedSurfaces( targetWindow, this.metadata );
         }

         if ( this.solverCfg.generateErrorImg )
         {
            stars = this.DetectStars(workingWindow, this.metadata);
            this.DrawErrors( targetWindow, this.metadata, stars );
         }

         return true;
      }
      finally
      {
         jsAbortable = abortableBackup;
         if ( auxWindow )
             auxWindow.forceClose();
      }
   };

   this.SaveImage = function( window )
   {
      if ( this.solverCfg.outSuffix.length == 0 )
         window.save();
      else
      {
         let newPath = File.extractDrive( window.filePath )
                     + File.extractDirectory( window.filePath ) + "/"
                     + File.extractName( window.filePath )
                     + this.solverCfg.outSuffix
                     + File.extractCompleteSuffix( window.filePath );
         window.saveAs( newPath,
                        false/*queryOptions*/,
                        false/*allowMessages*/,
                        true/*strict*/,
                        false/*verifyOverwrite*/ );
      }
   };
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

#ifndef USE_SOLVER_LIBRARY

function main()
{
   if ( Parameters.getBoolean( "resetSettingsAndExit" ) )
   {
      Settings.remove( SETTINGS_MODULE );
      return;
   }

   if ( Parameters.getBoolean( "resetSettings" ) )
      Settings.remove( SETTINGS_MODULE );

   let solver = new ImageSolver;

   if ( Parameters.isViewTarget )
   {
      let targetWindow = Parameters.targetView.window;

      solver.Init( Parameters.targetView.window );

      if ( solver.SolveImage( targetWindow ) )
      {
         solver.metadata.SaveSettings();

         // Print result
         console.writeln( "<end><cbr><br>Image Plate Solver script version ", SOLVERVERSION );
         console.writeln( "=".repeat( 79 ) );
         console.writeln( targetWindow.astrometricSolutionSummary() );
         ++__PJSR_AdpImageSolver_SuccessCount;
      }
   }
   else
   {
      let targetWindow = ImageWindow.activeWindow;

      if ( Parameters.getBoolean( "non_interactive" ) )
         solver.Init( targetWindow, false/*prioritizeSettings*/ );
      else
      {
         for ( ;; )
         {
            solver.Init( targetWindow, false/*prioritizeSettings*/ );
            let dialog = new ImageSolverDialog( solver.solverCfg, solver.metadata, true/*showTargetImage*/ );
            if ( dialog.execute() )
               break;
            if ( !dialog.resetRequest )
               return;
            solver = new ImageSolver();
         }

         if ( solver.error )
         {
            console.writeln( solver.error );
            return;
         }

         solver.solverCfg.SaveSettings();
         solver.metadata.SaveSettings();
      }

      if ( solver.solverCfg.useActive )
      {
         if ( solver.SolveImage( targetWindow ) )
         {
            solver.metadata.SaveSettings();

            // Print result
            console.writeln( "<end><cbr><br>Image Plate Solver script version ", SOLVERVERSION );
            console.writeln( "=".repeat( 79 ) );
            console.writeln( targetWindow.astrometricSolutionSummary() );
            ++__PJSR_AdpImageSolver_SuccessCount;
         }
      }
      else
      {
         if ( solver.solverCfg.files.length == 0 )
            throw "No image file has been selected";
         let errorList = [];
         for ( let i = 0; i < solver.solverCfg.files.length; ++i )
         {
            let filePath = solver.solverCfg.files[i];
            let fileWindow = null;
            try
            {
               console.writeln( "<end><cbr><br>" + "*".repeat( 32 ) );
               console.writeln( "Processing image ", filePath );
               fileWindow = ImageWindow.open( filePath )[0];
               if ( !fileWindow )
               {
                  errorList.push( { id: File.extractNameAndExtension( filePath ),
                                    message: "The file could not be opened" } );
                  continue;
               }
               solver.Init( fileWindow, false/*prioritizeSettings*/ );
               solver.metadata.width = fileWindow.mainView.image.width;
               solver.metadata.height = fileWindow.mainView.image.height;
               if ( solver.SolveImage( fileWindow ) )
               {
                  solver.SaveImage( fileWindow );
                  console.writeln( "<end><cbr><br>", filePath );
                  console.writeln( "=".repeat( 79 ) );
                  console.writeln( fileWindow.astrometricSolutionSummary() );
                  ++__PJSR_AdpImageSolver_SuccessCount;
               }
               else
                  errorList.push( { id: File.extractNameAndExtension( filePath ),
                                    message: "The image could not be plate solved" } );
            }
            catch ( ex )
            {
               console.writeln( "*".repeat( 32 ) );
               console.writeln( "Error in image <raw>" + filePath + "</raw>: " + ex );
               errorList.push( { id: File.extractNameAndExtension( filePath ),
                                 message: ex } );
            }

            if ( fileWindow )
               fileWindow.forceClose();

            gc( true );
         }

         console.writeln();
         if ( errorList.length > 0 )
         {
            console.warningln( "** Warning: Process finished with errors:" );
            for ( let i = 0; i < errorList.length; ++i )
               console.criticalln( "  " + errorList[i].id + ": " + errorList[i].message );
         }
         else
            console.noteln( "* Process finished without errors." );
      }
   }
}

main();

#endif // !USE_SOLVER_LIBRARY

#undef USE_SOLVER_LIBRARY
