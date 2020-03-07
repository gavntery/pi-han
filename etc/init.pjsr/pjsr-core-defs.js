//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/pjsr-core-defs.js - Released 2018-10-18T17:41:27Z
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.
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

/*
 * PJSR Core Object Definitions
 *
 * Introspection of non-native JavaScript core objects.
 */

#define READ_ONLY true

TypeDescription.enterDefinitionContext();

/*
 * Color
 */
if ( !TypeDescription.objectDefined( "Color" ) )
{
   TypeDescription.beginObjectDefinition( "Color" );

   TypeDescription.defineIncludedFile( "#include <pjsr/Color.jsh>" );

   TypeDescription.defineStaticMethod( "uint8 Color.alpha( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.alphaF( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint8 Color.red( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.redF( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint8 Color.green( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.greenF( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint8 Color.blue( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.blueF( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Boolean Color.isGray( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.hue( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.value( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.hsvSaturation( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "Number Color.hsiSaturation( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint32 Color.clearAlpha( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint32 Color.clearRed( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint32 Color.clearGreen( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint32 Color.clearBlue( uint32 rgba )" );
   TypeDescription.defineStaticMethod( "uint32 Color.setAlpha( uint32 rgba, a )" );
   TypeDescription.defineStaticMethod( "uint32 Color.setRed( uint32 rgba, r )" );
   TypeDescription.defineStaticMethod( "uint32 Color.setGreen( uint32 rgba, g )" );
   TypeDescription.defineStaticMethod( "uint32 Color.setBlue( uint32 rgba, b )" );
   TypeDescription.defineStaticMethod( "uint32 Color.rgbaColor( uint8 r, uint8 g, uint8 b, uint8 a )" );
   TypeDescription.defineStaticMethod( "uint32 Color.rgbaColorF( Number r, Number g, Number b, Number a )" );
   TypeDescription.defineStaticMethod( "String Color.rgbColorToHexString( uint32 rgb )" );
   TypeDescription.defineStaticMethod( "String Color.rgbaColorToHexString( uint32 rgba )" );

   TypeDescription.defineConstant( "uint32 Color.TRANSPARENT" );
   TypeDescription.defineConstant( "uint32 Color.BLACK" );
   TypeDescription.defineConstant( "uint32 Color.WHITE" );
   TypeDescription.defineConstant( "uint32 Color.GRAY" );
   TypeDescription.defineConstant( "uint32 Color.RED" );
   TypeDescription.defineConstant( "uint32 Color.GREEN" );
   TypeDescription.defineConstant( "uint32 Color.BLUE" );

   TypeDescription.endObjectDefinition();
}

/*
 * ColorComboBox
 */
if ( !TypeDescription.objectDefined( "ColorComboBox" ) )
{
   TypeDescription.beginObjectDefinition( "ColorComboBox" );

   TypeDescription.defineIncludedFile( "#include <pjsr/ColorComboBox.jsh>" );

   TypeDescription.inherit( "ComboBox" );

   TypeDescription.defineConstructor( "new ColorComboBox( [Control parent] )" );

   TypeDescription.defineProperty( "uint32 ColorComboBox.customRGBA" );

   TypeDescription.defineEventHandler( "void ColorComboBox.onCurrentColorChanged( uint32 rgba )" );
   TypeDescription.defineEventHandler( "void ColorComboBox.onColorSelected( uint32 rgba )" );

   TypeDescription.defineMethod( "uint32 ColorComboBox.colorForIndex( int index )" );
   TypeDescription.defineMethod( "uint32 ColorComboBox.currentColor()" );
   TypeDescription.defineMethod( "void ColorComboBox.setCurrentColor( uint32 rgba )" );

   TypeDescription.endObjectDefinition();
}

/*
 * NumericEdit
 */
if ( !TypeDescription.objectDefined( "NumericEdit" ) )
{
   TypeDescription.beginObjectDefinition( "NumericEdit" );

   TypeDescription.defineIncludedFile( "#include <pjsr/NumericControl.jsh>" );

   TypeDescription.inherit( "Control" );

   TypeDescription.defineProperty( "Label NumericEdit.label" );
   TypeDescription.defineProperty( "Edit NumericEdit.edit" );
   TypeDescription.defineProperty( "Sizer NumericEdit.sizer" );
   TypeDescription.defineProperty( "Number NumericEdit.value", READ_ONLY );
   TypeDescription.defineProperty( "Number NumericEdit.lowerBound", READ_ONLY );
   TypeDescription.defineProperty( "Number NumericEdit.upperBound", READ_ONLY );
   TypeDescription.defineProperty( "Boolean NumericEdit.real", READ_ONLY );
   TypeDescription.defineProperty( "int NumericEdit.precision", READ_ONLY );
   TypeDescription.defineProperty( "Boolean NumericEdit.scientific", READ_ONLY );
   TypeDescription.defineProperty( "int NumericEdit.sciTriggerExp", READ_ONLY );
   TypeDescription.defineProperty( "Boolean NumericEdit.autoEditWidth" );

   TypeDescription.defineEventHandler( "void NumericEdit.onValueUpdated( Number value )" );

   TypeDescription.defineConstructor( "new NumericEdit( [Control parent] )" );

   TypeDescription.defineMethod( "void NumericEdit.setValue( Number value )" );
   TypeDescription.defineMethod( "void NumericEdit.setReal( Boolean real )" );
   TypeDescription.defineMethod( "void NumericEdit.setRange( Number lowerBound, Number upperBound )" );
   TypeDescription.defineMethod( "void NumericEdit.setPrecision( int digits )" );
   TypeDescription.defineMethod( "void NumericEdit.enableScientificNotation( Boolean enable )" );
   TypeDescription.defineMethod( "void NumericEdit.setScientificNotationTriggerExponent( int exp10 )" );

   TypeDescription.endObjectDefinition();
}

/*
 * NumericControl
 */
if ( !TypeDescription.objectDefined( "NumericControl" ) )
{
   TypeDescription.beginObjectDefinition( "NumericControl" );

   TypeDescription.defineIncludedFile( "#include <pjsr/NumericControl.jsh>" );

   TypeDescription.inherit( "NumericEdit" );

   TypeDescription.defineProperty( "HorizontalSlider NumericControl.slider" );

   TypeDescription.endObjectDefinition();
}

/*
 * SectionBar
 */
if ( !TypeDescription.objectDefined( "SectionBar" ) )
{
   TypeDescription.beginObjectDefinition( "SectionBar" );

   TypeDescription.defineIncludedFile( "#include <pjsr/SectionBar.jsh>" );

   TypeDescription.inherit( "Control" );

   TypeDescription.defineConstructor( "new SectionBar( [Control parent[, String title]] )" );

   TypeDescription.defineProperty( "Control SectionBar.section" );
   TypeDescription.defineProperty( "CheckBox SectionBar.checkBox" );

   TypeDescription.defineEventHandler( "void SectionBar.onToggleSection( SectionBar bar, Boolean toggleBegin )" );
   TypeDescription.defineEventHandler( "void SectionBar.onCheckSection( SectionBar bar )" );

   TypeDescription.defineMethod( "Boolean SectionBar.hasCheckBox()" );
   TypeDescription.defineMethod( "Boolean SectionBar.isChecked()" );
   TypeDescription.defineMethod( "void SectionBar.enableCheckBox()" );
   TypeDescription.defineMethod( "String SectionBar.title()" );
   TypeDescription.defineMethod( "void SectionBar.setTitle( String title )" );
   TypeDescription.defineMethod( "Boolean SectionBar.hasSection()" );
   TypeDescription.defineMethod( "void SectionBar.setSection( Control section )" );
   TypeDescription.defineMethod( "Boolean SectionBar.isExpanded()" );
   TypeDescription.defineMethod( "Boolean SectionBar.isCollapsed()" );
   TypeDescription.defineMethod( "void SectionBar.toggleSection()" );
   TypeDescription.defineMethod( "void SectionBar.updateSection()" );

   TypeDescription.endObjectDefinition();
}

/*
 * SimpleColorDialog
 */
if ( !TypeDescription.objectDefined( "SimpleColorDialog" ) )
{
   TypeDescription.beginObjectDefinition( "SimpleColorDialog" );

   TypeDescription.defineIncludedFile( "#include <pjsr/SimpleColorDialog.jsh>" );

   TypeDescription.inherit( "Dialog" );

   TypeDescription.defineConstructor( "new SimpleColorDialog( [uint32 color] )" );

   TypeDescription.defineProperty( "uint32 SimpleColorDialog.color" );
   TypeDescription.defineProperty( "Boolean SimpleColorDialog.grayscale" );
   TypeDescription.defineProperty( "Boolean SimpleColorDialog.alphaEnabled" );

   TypeDescription.endObjectDefinition();
}

/*
 * HorizontalSizer
 */
if ( !TypeDescription.objectDefined( "HorizontalSizer" ) )
{
   TypeDescription.beginObjectDefinition( "HorizontalSizer" );

   TypeDescription.defineIncludedFile( "#include <pjsr/Sizer.jsh>" );

   TypeDescription.inherit( "Sizer" );

   TypeDescription.defineConstructor( "new HorizontalSizer()" );

   TypeDescription.endObjectDefinition();
}

/*
 * VerticalSizer
 */
if ( !TypeDescription.objectDefined( "VerticalSizer" ) )
{
   TypeDescription.beginObjectDefinition( "VerticalSizer" );

   TypeDescription.defineIncludedFile( "#include <pjsr/Sizer.jsh>" );

   TypeDescription.inherit( "Sizer" );

   TypeDescription.defineConstructor( "new VerticalSizer()" );

   TypeDescription.endObjectDefinition();
}

/*
 * HorizontalSlider
 */
if ( !TypeDescription.objectDefined( "HorizontalSlider" ) )
{
   TypeDescription.beginObjectDefinition( "HorizontalSlider" );

   TypeDescription.defineIncludedFile( "#include <pjsr/Slider.jsh>" );

   TypeDescription.inherit( "Slider" );

   TypeDescription.defineConstructor( "new HorizontalSlider( [Control parent] )" );

   TypeDescription.endObjectDefinition();
}

/*
 * VerticalSlider
 */
if ( !TypeDescription.objectDefined( "VerticalSlider" ) )
{
   TypeDescription.beginObjectDefinition( "VerticalSlider" );

   TypeDescription.defineIncludedFile( "#include <pjsr/Slider.jsh>" );

   TypeDescription.inherit( "Slider" );

   TypeDescription.defineConstructor( "new VerticalSlider( [Control parent] )" );

   TypeDescription.endObjectDefinition();
}

/*
 * StarDetector
 */
if ( !TypeDescription.objectDefined( "StarDetector" ) )
{
   TypeDescription.beginObjectDefinition( "StarDetector" );

   TypeDescription.defineIncludedFile( "#include <pjsr/StarDetector.jsh>" );

   TypeDescription.defineConstructor( "new StarDetector()" );

   TypeDescription.defineProperty( "int StarDetector.structureLayers" );
   TypeDescription.defineProperty( "int StarDetector.hotPixelFilterRadius" );
   TypeDescription.defineProperty( "int StarDetector.noiseReductionFilterRadius" );
   TypeDescription.defineProperty( "Number StarDetector.sensitivity" );
   TypeDescription.defineProperty( "Number StarDetector.peakResponse" );
   TypeDescription.defineProperty( "Number StarDetector.maxDistortion" );
   TypeDescription.defineProperty( "Number StarDetector.upperLimit" );
   TypeDescription.defineProperty( "Boolean StarDetector.invert" );
   TypeDescription.defineProperty( "Image StarDetector.mask" );
   TypeDescription.defineProperty( "int StarDetector.bkgDelta" );
   TypeDescription.defineProperty( "Number StarDetector.xyStretch" );

   TypeDescription.defineEventHandler( "Boolean StarDetector.progressCallback( int count, int total )" );

   TypeDescription.defineMethod( "void StarDetector.getStructureMap( Image map )" );
   TypeDescription.defineMethod( "Array StarDetector.stars( Image image )" );
   TypeDescription.defineMethod( "void StarDetector.test( Image image[, Boolean createStarMaskWindow=false] )" );

   TypeDescription.endObjectDefinition();
}

TypeDescription.leaveDefinitionContext();

#undef READ_ONLY

// ----------------------------------------------------------------------------
// EOF pjsr/pjsr-core-defs.js - Released 2018-10-18T17:41:27Z
