// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchPreprocessing-GUI.js - Released 2019-11-11T21:10:55Z
// ----------------------------------------------------------------------------
//
// This file is part of Batch Preprocessing Script version 1.52
//
// Copyright (c) 2012 Kai Wiechen
// Copyright (c) 2012-2019 Pleiades Astrophoto S.L.
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
 * Graphical user interface
 */

#include <pjsr/Color.jsh>
#include <pjsr/DataType.jsh>

// ----------------------------------------------------------------------------

function StyledTreeBox( parent )
{
   this.__base__ = TreeBox;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.alternateRowColor = true;
}

StyledTreeBox.prototype = new TreeBox;

// ----------------------------------------------------------------------------

function ParametersControl( title, parent, expand )
{
   this.__base__ = Control;
   if ( parent )
   {
      this.__base__( parent );
      if ( !parent.parameterControls )
         parent.parameterControls = new Array;
      parent.parameterControls.push( this );
   }
   else
      this.__base__();

   if ( expand )
   {
      this.expand = expand;
      this.hide();
   }
   else
      this.expand = false;

   var r = Color.red( this.dialog.backgroundColor );
   var g = Color.green( this.dialog.backgroundColor );
   var b = Color.blue( this.dialog.backgroundColor );
   var r1 = (r > 16) ? r - 16 : r + 16;
   var g1 = (g > 16) ? g - 16 : g + 16;
   var b1 = (b > 16) ? b - 16 : b + 16;

   // Force this generic control (=QWidget) to inherit its dialog's font.
   this.font = this.dialog.font;

   this.titleLabel = new Label( this );
   this.titleLabel.text = title ? title : "";
   this.titleLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;

   if ( this.expand )
   {
      this.closeButton = new ToolButton( this );
      this.closeButton.icon = this.scaledResource( ":/icons/close.png" );
      this.closeButton.setScaledFixedSize( 20, 20 );
      this.closeButton.toolTip = "返回";
      this.closeButton.onClick = function()
      {
         this.parent.parent.hide();
      };
   }
   else
      this.closeButton = null;

   this.titleBar = new Control( this );
   this.titleBar.styleSheet = this.scaledStyleSheet(
      "QWidget#" + this.titleBar.uniqueId + " {"
   +     "border: 1px solid gray;"
   +     "border-bottom: none;"
   +     "background-color: " + Color.rgbColorToHexString( Color.rgbaColor( r1, g1, b1 ) ) + ";"
   +  "}"
   +  "QLabel {"
   +     "color: blue;"
   +     "padding-top: 2px;"
   +     "padding-bottom: 2px;"
   +     "padding-left: 4px;"
   +  "}"
   +  "QLabel:disabled {"
   +     "color: gray;"
   +  "}" );
   this.titleBar.sizer = new HorizontalSizer;
   this.titleBar.sizer.add( this.titleLabel );
   this.titleBar.sizer.addStretch();
   if ( this.expand )
   {
      this.titleBar.sizer.add( this.closeButton );
      this.titleBar.sizer.addSpacing( 4 );
   }

   this.contents = new Control( this );
   this.contents.styleSheet = this.scaledStyleSheet(
      "QWidget#" + this.contents.uniqueId + " {"
   +     "border: 1px solid gray;"
   +  "}" );

   this.contents.sizer = new VerticalSizer;
   this.contents.sizer.margin = 6;
   this.contents.sizer.spacing = 6;
   this.contents.sizer.addSpacing( 8 );

   this.sizer = new VerticalSizer;
   this.sizer.add( this.titleBar );
   this.sizer.add( this.contents );

   this.add = function( control )
   {
      this.contents.sizer.add( control );
   };

   this.onShow = function()
   {
      if ( this.expand )
         for ( var i = 0; i < this.parent.parameterControls.length; ++i )
         {
            var sibling = this.parent.parameterControls[i];
            if ( sibling.uniqueId != this.uniqueId )
               sibling.hide();
         }
   };

   this.onHide = function()
   {
      if ( this.expand )
         for ( var i = 0; i < this.parent.parameterControls.length; ++i )
         {
            var sibling = this.parent.parameterControls[i];
            if ( !sibling.expand && sibling.uniqueId != this.uniqueId )
               sibling.show();
         }
   };
}

ParametersControl.prototype = new Control;

// ----------------------------------------------------------------------------

function OverscanRectControl( parent, overscan, sourceRegion )
{
   this.__base__ = Control;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   var editWidth1 = 7 * this.font.width( "0" );

   this.label = new Label( this );
   this.label.text = ((overscan < 0) ? "图像" : (sourceRegion ? "源" : "目标")) + " 范围:";
   this.label.minWidth = this.dialog.labelWidth1;
   this.label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   var fullName = "过扫描 " + ((overscan < 0) ? "图像" : "#" + (overscan+1).toString() + (sourceRegion ? " 源" : " 目标")) + " 范围";

   this.leftControl = new NumericEdit( this );
   this.leftControl.overscan = overscan;
   this.leftControl.sourceRegion = sourceRegion;
   this.leftControl.label.hide();
   this.leftControl.setReal( false );
   this.leftControl.setRange( 0, 9999999 )
   this.leftControl.edit.setFixedWidth( editWidth1 );
   this.leftControl.toolTip = "<p>CCD像素中" + fullName + "的左侧边界坐标。</p>"
   this.leftControl.onValueUpdated = function( value )
   {
      var ivalue = Math.trunc( value );
      if ( this.overscan < 0 )
         engine.overscan.imageRect.x0 = ivalue;
      else if ( this.sourceRegion )
         engine.overscan.overscan[this.overscan].sourceRect.x0 = ivalue;
      else
         engine.overscan.overscan[this.overscan].targetRect.x0 = ivalue;
   };

   this.topControl = new NumericEdit( this );
   this.topControl.overscan = overscan;
   this.topControl.sourceRegion = sourceRegion;
   this.topControl.label.hide();
   this.topControl.setReal( false );
   this.topControl.setRange( 0, 9999999 )
   this.topControl.edit.setFixedWidth( editWidth1 );
   this.topControl.toolTip = "<p>CCD像素中" + fullName + "的顶部边界坐标。</p>"
   this.topControl.onValueUpdated = function( value )
   {
      var ivalue = Math.trunc( value );
      if ( this.overscan < 0 )
         engine.overscan.imageRect.y0 = ivalue;
      else if ( this.sourceRegion )
         engine.overscan.overscan[this.overscan].sourceRect.y0 = ivalue;
      else
         engine.overscan.overscan[this.overscan].targetRect.y0 = ivalue;
   };

   this.widthControl = new NumericEdit( this );
   this.widthControl.overscan = overscan;
   this.widthControl.sourceRegion = sourceRegion;
   this.widthControl.label.hide();
   this.widthControl.setReal( false );
   this.widthControl.setRange( 0, 9999999 )
   this.widthControl.edit.setFixedWidth( editWidth1 );
   this.widthControl.toolTip = "<p>CCD像素中" + fullName + "的宽度。</p>"
   this.widthControl.onValueUpdated = function( value )
   {
      var ivalue = Math.trunc( value );
      if ( this.overscan < 0 )
         engine.overscan.imageRect.x1 = engine.overscan.imageRect.x0 + ivalue;
      else if ( this.sourceRegion )
         engine.overscan.overscan[this.overscan].sourceRect.x1 = engine.overscan.overscan[this.overscan].sourceRect.x0 + ivalue;
      else
         engine.overscan.overscan[this.overscan].targetRect.x1 = engine.overscan.overscan[this.overscan].targetRect.x0 + ivalue;
   };

   this.heightControl = new NumericEdit( this );
   this.heightControl.overscan = overscan;
   this.heightControl.sourceRegion = sourceRegion;
   this.heightControl.label.hide();
   this.heightControl.setReal( false );
   this.heightControl.setRange( 0, 9999999 )
   this.heightControl.edit.setFixedWidth( editWidth1 );
   this.heightControl.toolTip = "<p>CCD像素中" + fullName + "的高度。</p>"
   this.heightControl.onValueUpdated = function( value )
   {
      var ivalue = Math.trunc( value );
      if ( this.overscan < 0 )
         engine.overscan.imageRect.y1 = engine.overscan.imageRect.y0 + ivalue;
      else if ( this.sourceRegion )
         engine.overscan.overscan[this.overscan].sourceRect.y1 = engine.overscan.overscan[this.overscan].sourceRect.y0 + ivalue;
      else
         engine.overscan.overscan[this.overscan].targetRect.y1 = engine.overscan.overscan[this.overscan].targetRect.y0 + ivalue;
   };

   this.toolTip = "<p>" + fullName + ".</p>";

   this.sizer = new HorizontalSizer;
   this.sizer.spacing = 4;
   this.sizer.add( this.label );
   this.sizer.add( this.leftControl );
   this.sizer.add( this.topControl );
   this.sizer.add( this.widthControl );
   this.sizer.add( this.heightControl );
   this.sizer.addStretch();
}

OverscanRectControl.prototype = new Control;

// ----------------------------------------------------------------------------

function OverscanRegionControl( parent, overscan )
{
   this.__base__ = Control;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   if ( overscan < 0 )
   {
      this.imageRectControl = new OverscanRectControl( this, overscan, false );

      this.sizer = new VerticalSizer;
      this.sizer.add( this.imageRectControl );
   }
   else
   {
      this.applyCheckBox = new CheckBox( this );
      this.applyCheckBox.overscan = overscan;
      this.applyCheckBox.text = "过扫描 #" + (overscan+1).toString();
      this.applyCheckBox.toolTip = "<p>启用过扫描区域 #" + (overscan+1).toString() + ".</p>";
      this.applyCheckBox.onCheck = function( checked )
      {
         engine.overscan.overscan[this.overscan].enabled = checked;
         var biasPage = this.dialog.tabBox.pageControlByIndex( ImageType.BIAS );
         biasPage.overscanControl.updateControls();
      };

      this.applySizer = new HorizontalSizer;
      this.applySizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
      this.applySizer.add( this.applyCheckBox );
      this.applySizer.addStretch();

      this.sourceRectControl = new OverscanRectControl( this, overscan, true );
      this.targetRectControl = new OverscanRectControl( this, overscan, false );

      this.sizer = new VerticalSizer;
      this.sizer.spacing = 4;
      this.sizer.add( this.applySizer );
      this.sizer.add( this.sourceRectControl );
      this.sizer.add( this.targetRectControl );
   }
}

OverscanRegionControl.prototype = new Control;

// ----------------------------------------------------------------------------

function OverscanControl( parent, expand )
{
   this.__base__ = ParametersControl;
   this.__base__( "过扫描(Overscan)", parent, expand );

   //

   this.imageControl = new OverscanRegionControl( this, -1 );
   this.overscanControls = new Array;
   this.overscanControls.push( new OverscanRegionControl( this, 0 ) );
   this.overscanControls.push( new OverscanRegionControl( this, 1 ) );
   this.overscanControls.push( new OverscanRegionControl( this, 2 ) );
   this.overscanControls.push( new OverscanRegionControl( this, 3 ) );

   this.add( this.imageControl );
   this.add( this.overscanControls[0] );
   this.add( this.overscanControls[1] );
   this.add( this.overscanControls[2] );
   this.add( this.overscanControls[3] );

   this.updateControls = function()
   {
      this.imageControl.imageRectControl.leftControl.setValue( engine.overscan.imageRect.x0 );
      this.imageControl.imageRectControl.topControl.setValue( engine.overscan.imageRect.y0 );
      this.imageControl.imageRectControl.widthControl.setValue( engine.overscan.imageRect.width );
      this.imageControl.imageRectControl.heightControl.setValue( engine.overscan.imageRect.height );

      for ( var i = 0; i < 4; ++i )
      {
         var enabled = engine.overscan.overscan[i].enabled;
         this.overscanControls[i].applyCheckBox.checked = enabled;
         this.overscanControls[i].sourceRectControl.leftControl.setValue( engine.overscan.overscan[i].sourceRect.x0 );
         this.overscanControls[i].sourceRectControl.topControl.setValue( engine.overscan.overscan[i].sourceRect.y0 );
         this.overscanControls[i].sourceRectControl.widthControl.setValue( engine.overscan.overscan[i].sourceRect.width );
         this.overscanControls[i].sourceRectControl.heightControl.setValue( engine.overscan.overscan[i].sourceRect.height );
         this.overscanControls[i].sourceRectControl.enabled = enabled;
         this.overscanControls[i].targetRectControl.leftControl.setValue( engine.overscan.overscan[i].targetRect.x0 );
         this.overscanControls[i].targetRectControl.topControl.setValue( engine.overscan.overscan[i].targetRect.y0 );
         this.overscanControls[i].targetRectControl.widthControl.setValue( engine.overscan.overscan[i].targetRect.width );
         this.overscanControls[i].targetRectControl.heightControl.setValue( engine.overscan.overscan[i].targetRect.height );
         this.overscanControls[i].targetRectControl.enabled = enabled;
      }

      this.contents.enabled = engine.overscan.enabled;
   };

   this.parentOnShow = this.onShow;

   this.onShow = function()
   {
      var biasPage = this.dialog.tabBox.pageControlByIndex( ImageType.BIAS );
      this.setFixedWidth( biasPage.imageIntegrationControl.width );
      this.parentOnShow();
   };
}

OverscanControl.prototype = new Control;

// ----------------------------------------------------------------------------

function BiasOverscanControl( parent )
{
   this.__base__ = ParametersControl;
   this.__base__( "过扫描(Overscan)", parent );

   //

   this.applyCheckBox = new CheckBox( this );
   this.applyCheckBox.text = "启用";
   this.applyCheckBox.toolTip = "<p>启用过扫描(overscan)校准。</p>";
   this.applyCheckBox.onCheck = function( checked )
   {
      engine.overscan.enabled = checked;
      var biasPage = this.dialog.tabBox.pageControlByIndex( ImageType.BIAS );
      biasPage.biasOverscanControl.updateControls();
      biasPage.overscanControl.updateControls();
   };

   this.applySizer = new HorizontalSizer;
   this.applySizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.applySizer.add( this.applyCheckBox );
   this.applySizer.addStretch();

   //

   this.editButton = new PushButton( this );
   this.editButton.text = "过扫描(Overscan)参数...";
   this.editButton.icon = this.scaledResource( ":/icons/arrow-right.png" );
   this.editButton.toolTip = "<p>编辑overscan的参数.</p>";
   this.editButton.onClick = function()
   {
      var biasPage = this.dialog.tabBox.pageControlByIndex( ImageType.BIAS );
      biasPage.overscanControl.show();
   };

   this.editSizer = new HorizontalSizer;
   this.editSizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.editSizer.add( this.editButton );
   this.editSizer.addStretch();

   //

   this.add( this.applySizer );
   this.add( this.editSizer );

   this.updateControls = function()
   {
      this.applyCheckBox.checked = engine.overscan.enabled;
      this.editButton.enabled = engine.overscan.enabled;
   };
}

BiasOverscanControl.prototype = new Control;

// ----------------------------------------------------------------------------

function ImageIntegrationControl( parent, imageType, expand )
{
   this.__base__ = ParametersControl;
   this.__base__( "图像堆叠", parent, expand );

   this.imageType = imageType;

   //

   this.combinationLabel = new Label( this );
   this.combinationLabel.text = "合成:";
   this.combinationLabel.minWidth = this.dialog.labelWidth1;
   this.combinationLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.combinationComboBox = new ComboBox( this );
   this.combinationComboBox.addItem( "平均值" );
   this.combinationComboBox.addItem( "中位数" );
   this.combinationComboBox.addItem( "最大值" );
   this.combinationComboBox.addItem( "最小值" );
   this.combinationComboBox.onItemSelected = function( item )
   {
      engine.combination[this.parent.parent.imageType] = item;
   };

   this.combinationLabel.toolTip = this.combinationComboBox.toolTip =
      "<p><b>平均值</b>合成为图像堆叠提供最佳的信噪比。</p>" +
      "<p><b>中位数</b>合成提供对异常值更强健的排斥，但以更多的噪声为代价.</p>";

   this.combinationSizer = new HorizontalSizer;
   this.combinationSizer.spacing = 4;
   this.combinationSizer.add( this.combinationLabel );
   this.combinationSizer.add( this.combinationComboBox, 100 );

   //

   this.rejectionAlgorithmLabel = new Label( this );
   this.rejectionAlgorithmLabel.text = "排斥算法:";
   this.rejectionAlgorithmLabel.minWidth = this.dialog.labelWidth1;
   this.rejectionAlgorithmLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.rejectionAlgorithmComboBox = new ComboBox( this );
   let names = engine.rejectionNames();
   names.forEach( item => this.rejectionAlgorithmComboBox.addItem( item ) );
   this.rejectionAlgorithmComboBox.onItemSelected = function( item )
   {
      engine.rejection[this.parent.parent.imageType] = engine.rejectionFromIndex( item );
      this.parent.parent.updateControls();
   };

   this.rejectionAlgorithmLabel.toolTip = this.rejectionAlgorithmComboBox.toolTip =
      "<p><b>标准差剪切(Sigma Clipping)</b>算法通常是合成10-15个以上图像的理想算法。" +
      "记住，要想使用Sigma Clipping算法，预估的标准差散布情况必须很好，因此堆栈中的像素越多越好" +
      "(也就是图像越多越好)。</p>" +
      "<p><b>Winsorized标准差剪切(Sigma Clipping)</b>算法与普通的Sigma Clipping算法类似。" +
      "但是它使用了一个特殊的迭代过程，这个迭代过程是基于Huber的使用<i>缩尾处理" +
      "(Winsorization)</i>的健壮性参数评估方法。该算法可以更好地保留离散值，" +
      "从而可以更好地保留大量图像的重要数据。</p>" +
      "<p><b>线性拟合剪切(Linear fit clipping)</b>将每个像素堆栈拟合到一条直线。线性拟合在" +
      "最小化平均绝对偏差和最大化内联的双重意义上进行了优化。对于大型图像集，此排斥算法比标准差" +
      "剪切(Sigma Clipping)算法更健壮，尤其是在存在强度和空间分布变化的附加天空渐变的情况下。" +
      "为了获得最佳性能，请将此算法用于至少15张图像的大集合。最少需要五张图像。</p>" +
      (ImageIntegration.prototype.Rejection_ESD ?
      "<p><b>GESD(Generalized Extreme Studentized Deviate)测试</b>排斥算法是Bernard Rosner" +
      "在1983年发表的论文<i>《Percentage Points for a Generalized ESD Many-Outlier Procedure》</i>" +
      "中描述的一种算法，适用于图像堆叠任务。" +
      "ESD算法假定在没有异常值的情况下，每个像素堆栈都遵循近似正态（高斯）分布。它旨在避免<i>掩盖</i>，当一个" +
      "异常值因为与另一个异常值相似而未被检测到时，就会发生严重的问题。对于25个或更多图像的大型数据集，" +
      "尤其是对于50个或更多帧的大型数据集，此算法的性能可能非常出色。最少需要3张图像。</p>" : "") +
      "<p><b>百分比剪切(Percentile Clipping)</b>排斥算法非常适合堆叠较小的图像集合，例如3到6张图像。" +
      "这是一种非迭代算法，相对于每个像素堆栈的中位数都有一个固定的范围值，" +
      "这个算法可以将超出这个范围的异常像素排除在外。</p>" +
      "<p><b>平均迭代标准差剪切(Averaged Iterative Sigma Clipping)</b>适用于10张或更多图像的集合。" +
      "该算法尝试在假设读取噪声为零的情况下，从现有像素数据中得出理想CCD传感器的增益，然后使用泊松噪声模型进行抑制。" +
      "但是，对于大量图像，标准差剪切(Sigma Clipping)可能是个更好的选择。</p>" +
      "<p><b>最小值/最大值</b>方法可用于确保排除极值。最小值/最大值无条件地排除每个堆栈中固定数量的像素，" +
      "而无需任何统计依据。基于可靠统计信息的排异算法通常都是很好的选择，例如百分比剪切(Percentile Clipping)、" +
      "Winsorized标准差剪切(Sigma Clipping)、线性拟合剪切(Linear Fit Clipping)和平均迭代标准差剪切" +
      "(Averaged Iterative Sigma Clipping)等。</p>";

   this.rejectionAlgorithmSizer = new HorizontalSizer;
   this.rejectionAlgorithmSizer.spacing = 4;
   this.rejectionAlgorithmSizer.add( this.rejectionAlgorithmLabel );
   this.rejectionAlgorithmSizer.add( this.rejectionAlgorithmComboBox, 100 );

   //

   this.minMaxLowLabel = new Label( this );
   this.minMaxLowLabel.text = "最小值/最大值下限:";
   this.minMaxLowLabel.minWidth = this.dialog.labelWidth1;
   this.minMaxLowLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.minMaxLowSpinBox = new SpinBox( this );
   this.minMaxLowSpinBox.minValue = 0;
   this.minMaxLowSpinBox.maxValue = 100;
   this.minMaxLowSpinBox.setFixedWidth( this.dialog.numericEditWidth + this.logicalPixelsToPhysical( 16 ) );
   this.minMaxLowSpinBox.toolTip = "<p>最小值/最大值算法将排除的低(暗)像素数。</p>";
   this.minMaxLowSpinBox.onValueUpdated = function( value )
   {
      engine.minMaxLow[this.parent.parent.imageType] = value;
   };

   this.minMaxLowLabel.toolTip = this.minMaxLowSpinBox.toolTip =
      "<p>最小值/最大值算法将排除的低(暗)像素数。</p>";

   this.minMaxLowSizer = new HorizontalSizer;
   this.minMaxLowSizer.spacing = 4;
   this.minMaxLowSizer.add( this.minMaxLowLabel );
   this.minMaxLowSizer.add( this.minMaxLowSpinBox );
   this.minMaxLowSizer.addStretch();

   //

   this.minMaxHighLabel = new Label( this );
   this.minMaxHighLabel.text = "最小值/最大值上限:";
   this.minMaxHighLabel.minWidth = this.dialog.labelWidth1;
   this.minMaxHighLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.minMaxHighSpinBox = new SpinBox( this );
   this.minMaxHighSpinBox.minValue = 0;
   this.minMaxHighSpinBox.maxValue = 100;
   this.minMaxHighSpinBox.setFixedWidth( this.dialog.numericEditWidth + this.logicalPixelsToPhysical( 16 ) );
   this.minMaxHighSpinBox.toolTip = "<p>最小值/最大值算法将排除的高(亮)像素数。</p>";
   this.minMaxHighSpinBox.onValueUpdated = function( value )
   {
      engine.minMaxHigh[this.parent.parent.imageType] = value;
   };

   this.minMaxHighLabel.toolTip = this.minMaxHighSpinBox.toolTip =
      "<p>最小值/最大值算法将排除的高(亮)像素数。</p>";

   this.minMaxHighSizer = new HorizontalSizer;
   this.minMaxHighSizer.spacing = 4;
   this.minMaxHighSizer.add( this.minMaxHighLabel );
   this.minMaxHighSizer.add( this.minMaxHighSpinBox );
   this.minMaxHighSizer.addStretch();

   //

   this.percentileLowControl = new NumericControl( this );
   this.percentileLowControl.label.text = "百分数下限:";
   this.percentileLowControl.label.minWidth = this.dialog.labelWidth1;
   this.percentileLowControl.setRange( 0, 1 );
   this.percentileLowControl.slider.setRange( 0, 1000 );
   this.percentileLowControl.slider.scaledMinWidth = 200;
   this.percentileLowControl.setPrecision( 2 );
   this.percentileLowControl.edit.setFixedWidth( this.dialog.numericEditWidth );
   this.percentileLowControl.toolTip = "<p>百分比剪切排异算法的低剪切因子。</p>";
   this.percentileLowControl.onValueUpdated = function( value )
   {
      engine.percentileLow[this.parent.parent.imageType] = value;
   };

   //

   this.percentileHighControl = new NumericControl( this );
   this.percentileHighControl.label.text = "百分数上限:";
   this.percentileHighControl.label.minWidth = this.dialog.labelWidth1;
   this.percentileHighControl.setRange( 0, 1 );
   this.percentileHighControl.slider.setRange( 0, 1000 );
   this.percentileHighControl.slider.scaledMinWidth = 200;
   this.percentileHighControl.setPrecision( 2 );
   this.percentileHighControl.edit.setFixedWidth( this.dialog.numericEditWidth );
   this.percentileHighControl.toolTip = "<p>百分比剪切排异算法的高剪切因子。</p>";
   this.percentileHighControl.onValueUpdated = function( value )
   {
      engine.percentileHigh[this.parent.parent.imageType] = value;
   };

   //

   this.sigmaLowControl = new NumericControl( this );
   this.sigmaLowControl.label.text = "SigmaClip下限:";
   this.sigmaLowControl.label.minWidth = this.dialog.labelWidth1;
   this.sigmaLowControl.setRange( 0, 10 );
   this.sigmaLowControl.slider.setRange( 0, 1000 );
   this.sigmaLowControl.slider.scaledMinWidth = 200;
   this.sigmaLowControl.setPrecision( 2 );
   this.sigmaLowControl.setValue( 4.0 );
   this.sigmaLowControl.edit.setFixedWidth( this.dialog.numericEditWidth );
   this.sigmaLowControl.toolTip = "<p>标准差剪切排异算法的低剪切因子。</p>";
   this.sigmaLowControl.onValueUpdated = function( value )
   {
      engine.sigmaLow[this.parent.parent.imageType] = value;
   };

   //

   this.sigmaHighControl = new NumericControl( this );
   this.sigmaHighControl.label.text = "SigmaClip上限:";
   this.sigmaHighControl.label.minWidth = this.dialog.labelWidth1;
   this.sigmaHighControl.setRange ( 0, 10 );
   this.sigmaHighControl.slider.setRange( 0, 1000 );
   this.sigmaHighControl.slider.scaledMinWidth = 200;
   this.sigmaHighControl.setPrecision( 2 );
   this.sigmaHighControl.setValue( 2.0 );
   this.sigmaHighControl.edit.setFixedWidth( this.dialog.numericEditWidth );
   this.sigmaHighControl.toolTip = "<p>标准差剪切排异算法的低剪切因子。</p>";
   this.sigmaHighControl.onValueUpdated = function( value )
   {
      engine.sigmaHigh[this.parent.parent.imageType] = value;
   };

   //

   this.linearFitLowControl = new NumericControl( this );
   this.linearFitLowControl.label.text = "线性拟合(Linear fit)下限:";
   this.linearFitLowControl.label.minWidth = this.dialog.labelWidth1;
   this.linearFitLowControl.setRange( 0, 10 );
   this.linearFitLowControl.slider.setRange( 0, 1000 );
   this.linearFitLowControl.slider.scaledMinWidth = 200;
   this.linearFitLowControl.setPrecision( 2 );
   this.linearFitLowControl.setValue( 5.0 );
   this.linearFitLowControl.edit.setFixedWidth( this.dialog.numericEditWidth );
   this.linearFitLowControl.toolTip = "<p>线性拟合剪切排异算法的低剪切因子。</p>";
   this.linearFitLowControl.onValueUpdated = function( value )
   {
      engine.linearFitLow[this.parent.parent.imageType] = value;
   };

   //

   this.linearFitHighControl = new NumericControl( this );
   this.linearFitHighControl.label.text = "线性拟合(Linear fit)上限:";
   this.linearFitHighControl.label.minWidth = this.dialog.labelWidth1;
   this.linearFitHighControl.setRange( 0, 10 );
   this.linearFitHighControl.slider.setRange( 0, 1000 );
   this.linearFitHighControl.slider.scaledMinWidth = 200;
   this.linearFitHighControl.setPrecision( 2 );
   this.linearFitHighControl.setValue( 2.5 );
   this.linearFitHighControl.edit.setFixedWidth( this.dialog.numericEditWidth );
   this.linearFitHighControl.toolTip = "<p>线性拟合剪切排异算法的高剪切因子。</p>";
   this.linearFitHighControl.onValueUpdated = function( value )
   {
      engine.linearFitHigh[this.parent.parent.imageType] = value;
   };

   //

   if ( ImageIntegration.prototype.Rejection_ESD )
   {
      this.esdOutliersControl = new NumericControl( this );
      this.esdOutliersControl.label.text = "ESD异常值:";
      this.esdOutliersControl.label.minWidth = this.dialog.labelWidth1;
      this.esdOutliersControl.setRange( 0, 1 );
      this.esdOutliersControl.slider.setRange( 0, 1000 );
      this.esdOutliersControl.slider.scaledMinWidth = 200;
      this.esdOutliersControl.setPrecision( 2 );
      this.esdOutliersControl.setValue( 0.3 );
      this.esdOutliersControl.edit.setFixedWidth( this.dialog.numericEditWidth );
      this.esdOutliersControl.toolTip = "<p>GESD排异算法的预期奇异值的最大分数。</p>" +
         "<p>例如，将值0.2应用于10个像素的堆栈意味着ESD算法将被限制为最多检测两个奇异值像素，" +
         "换句话说，在这种情况下只能检测到0、1或2个奇异值。 默认值为0.3，这使算法可以检测每个" +
         "像素堆栈中多达30％的奇异像素。</p>";
      this.esdOutliersControl.onValueUpdated = function( value )
      {
         engine.esdOutliers[this.parent.parent.imageType] = value;
      };

      this.esdSignificanceControl = new NumericControl( this );
      this.esdSignificanceControl.label.text = "ESD重要度:";
      this.esdSignificanceControl.label.minWidth = this.dialog.labelWidth1;
      this.esdSignificanceControl.setRange( 0, 1 );
      this.esdSignificanceControl.slider.setRange( 0, 1000 );
      this.esdSignificanceControl.slider.scaledMinWidth = 200;
      this.esdSignificanceControl.setPrecision( 2 );
      this.esdSignificanceControl.setValue( 0.05 );
      this.esdSignificanceControl.edit.setFixedWidth( this.dialog.numericEditWidth );
      this.esdSignificanceControl.toolTip = "<p>Probability of making a type 1 error (false positive) in the generalized ESD " +
         "rejection algorithm.</p>" +
         "<p>This is the significance level of the outlier detection hypothesis test. For example, a significance level of 0.01 " +
         "means that a 1% chance of being wrong when rejecting the null hypothesis (that there are no outliers in a given pixel " +
         "stack) is acceptable. The default value is 0.05 (5% significance level).</p>";
      this.esdSignificanceControl.onValueUpdated = function( value )
      {
         engine.esdSignificance[this.parent.parent.imageType] = value;
      };
   }

   //

   this.add( this.combinationSizer );
   this.add( this.rejectionAlgorithmSizer );
   this.add( this.minMaxLowSizer );
   this.add( this.minMaxHighSizer );
   this.add( this.percentileLowControl );
   this.add( this.percentileHighControl );
   this.add( this.sigmaLowControl );
   this.add( this.sigmaHighControl );
   this.add( this.linearFitLowControl );
   this.add( this.linearFitHighControl );
   if ( ImageIntegration.prototype.Rejection_ESD )
   {
      this.add( this.esdOutliersControl );
      this.add( this.esdSignificanceControl );
   }

   if ( this.imageType == ImageType.FLAT )
   {
      this.largeScaleRejectionCheckBox = new CheckBox( this );
      this.largeScaleRejectionCheckBox.text = "大尺度像素排斥";
      this.largeScaleRejectionCheckBox.toolTip = "<p>应用大尺度像素排异，高像素采样值。有助于在堆叠平场是改善星点的排异。</p>";
      this.largeScaleRejectionCheckBox.onCheck = function( checked )
      {
         engine.flatsLargeScaleRejection = checked;
         this.parent.parent.updateControls();
      };

      this.largeScaleRejectionSizer = new HorizontalSizer;
      this.largeScaleRejectionSizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
      this.largeScaleRejectionSizer.add( this.largeScaleRejectionCheckBox );
      this.largeScaleRejectionSizer.addStretch();

      //

      this.largeScaleRejectionLayersLabel = new Label( this );
      this.largeScaleRejectionLayersLabel.text = "大尺度层数:";
      this.largeScaleRejectionLayersLabel.minWidth = this.dialog.labelWidth1;
      this.largeScaleRejectionLayersLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

      this.largeScaleRejectionLayersSpinBox = new SpinBox( this );
      this.largeScaleRejectionLayersSpinBox.minValue = 1;
      this.largeScaleRejectionLayersSpinBox.maxValue = 6;
      this.largeScaleRejectionLayersSpinBox.setFixedWidth( this.dialog.numericEditWidth + this.logicalPixelsToPhysical( 16 ) );
      this.largeScaleRejectionLayersSpinBox.onValueUpdated = function( value )
      {
         engine.flatsLargeScaleRejectionLayers = value;
      };

      this.largeScaleRejectionLayersLabel.toolTip = this.largeScaleRejectionLayersSpinBox.toolTip =
         "<p>大尺度像素排异时，受保护的小波层数。" +
         "增加它可以将大尺度排异限制为较大的连续排异像素结构。</p>";

      this.largeScaleRejectionLayersSizer = new HorizontalSizer;
      this.largeScaleRejectionLayersSizer.spacing = 4;
      this.largeScaleRejectionLayersSizer.add( this.largeScaleRejectionLayersLabel );
      this.largeScaleRejectionLayersSizer.add( this.largeScaleRejectionLayersSpinBox );
      this.largeScaleRejectionLayersSizer.addStretch();

      //

      this.largeScaleRejectionGrowthLabel = new Label( this );
      this.largeScaleRejectionGrowthLabel.text = "大尺度增长值:";
      this.largeScaleRejectionGrowthLabel.minWidth = this.dialog.labelWidth1;
      this.largeScaleRejectionGrowthLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

      this.largeScaleRejectionGrowthSpinBox = new SpinBox( this );
      this.largeScaleRejectionGrowthSpinBox.minValue = 1;
      this.largeScaleRejectionGrowthSpinBox.maxValue = 20;
      this.largeScaleRejectionGrowthSpinBox.setFixedWidth( this.dialog.numericEditWidth + this.logicalPixelsToPhysical( 16 ) );
      this.largeScaleRejectionGrowthSpinBox.onValueUpdated = function( value )
      {
         engine.flatsLargeScaleRejectionGrowth = value;
      };

      this.largeScaleRejectionGrowthLabel.toolTip = this.largeScaleRejectionGrowthSpinBox.toolTip =
         "<p>大尺度像素排异，排异结构成长的速度。 增加它可以将排异范围扩展到更多相邻像素。</p>";

      this.largeScaleRejectionGrowthSizer = new HorizontalSizer;
      this.largeScaleRejectionGrowthSizer.spacing = 4;
      this.largeScaleRejectionGrowthSizer.add( this.largeScaleRejectionGrowthLabel );
      this.largeScaleRejectionGrowthSizer.add( this.largeScaleRejectionGrowthSpinBox );
      this.largeScaleRejectionGrowthSizer.addStretch();

      //

      this.add( this.largeScaleRejectionSizer );
      this.add( this.largeScaleRejectionLayersSizer );
      this.add( this.largeScaleRejectionGrowthSizer );
   }

   this.updateControls = function()
   {
      this.combinationComboBox.currentItem        = engine.combination[this.imageType];
      this.rejectionAlgorithmComboBox.currentItem = engine.rejectionIndex( engine.rejection[this.imageType] );
      this.minMaxLowSpinBox.value                 = engine.minMaxLow[this.imageType];
      this.minMaxHighSpinBox.value                = engine.minMaxHigh[this.imageType];
      this.percentileLowControl.setValue(           engine.percentileLow[this.imageType] );
      this.percentileHighControl.setValue(          engine.percentileHigh[this.imageType] );
      this.sigmaLowControl.setValue(                engine.sigmaLow[this.imageType] );
      this.sigmaHighControl.setValue(               engine.sigmaHigh[this.imageType] );
      this.linearFitLowControl.setValue(            engine.linearFitLow[this.imageType] );
      this.linearFitHighControl.setValue(           engine.linearFitHigh[this.imageType] );

      this.minMaxLowLabel.enabled = false;
      this.minMaxLowSpinBox.enabled = false;
      this.minMaxHighLabel.enabled = false;
      this.minMaxHighSpinBox.enabled = false;
      this.percentileLowControl.enabled = false;
      this.percentileHighControl.enabled = false;
      this.sigmaLowControl.enabled = false;
      this.sigmaHighControl.enabled = false;
      this.linearFitLowControl.enabled = false;
      this.linearFitHighControl.enabled = false;
      if ( ImageIntegration.prototype.Rejection_ESD )
      {
         this.esdOutliersControl.enabled = false;
         this.esdSignificanceControl.enabled = false;
      }

      switch ( engine.rejection[this.imageType] )
      {
      case ImageIntegration.prototype.NoRejection:
         break;
      case ImageIntegration.prototype.MinMax:
         this.minMaxLowLabel.enabled = true;
         this.minMaxLowSpinBox.enabled = true;
         this.minMaxHighLabel.enabled = true;
         this.minMaxHighSpinBox.enabled = true;
         break;
      case ImageIntegration.prototype.PercentileClip:
         this.percentileLowControl.enabled = true;
         this.percentileHighControl.enabled = true;
         break;
      case ImageIntegration.prototype.SigmaClip:
      case ImageIntegration.prototype.WinsorizedSigmaClip:
      case ImageIntegration.prototype.AveragedSigmaClip:
         this.sigmaLowControl.enabled = true;
         this.sigmaHighControl.enabled = true;
         break;
      case ImageIntegration.prototype.LinearFit:
         this.linearFitLowControl.enabled = true;
         this.linearFitHighControl.enabled = true;
         break;
      case ImageIntegration.prototype.Rejection_ESD:
         this.esdOutliersControl.enabled = true;
         this.esdSignificanceControl.enabled = true;
         break;
      }

      if ( this.imageType == ImageType.FLAT )
      {
         this.largeScaleRejectionCheckBox.checked = engine.flatsLargeScaleRejection;
         this.largeScaleRejectionLayersSpinBox.value = engine.flatsLargeScaleRejectionLayers;
         this.largeScaleRejectionGrowthSpinBox.value = engine.flatsLargeScaleRejectionGrowth;

         let enabled = engine.rejection[this.imageType] != ImageIntegration.prototype.NoRejection;
         this.largeScaleRejectionCheckBox.enabled = enabled;
         this.largeScaleRejectionLayersSpinBox.enabled = enabled && engine.flatsLargeScaleRejection;
         this.largeScaleRejectionGrowthSpinBox.enabled = enabled && engine.flatsLargeScaleRejection;
      }

      if ( this.imageType != ImageType.LIGHT )
         this.enabled = !engine.useAsMaster[this.imageType];
   };
}

ImageIntegrationControl.prototype = new Control;

// ----------------------------------------------------------------------------

function CosmeticCorrectionControl( parent )
{
   this.__base__ = ParametersControl;
   this.__base__( "瑕疵校正(Cosmetic Correction)", parent );

   //

   this.applyCheckBox = new CheckBox( this );
   this.applyCheckBox.text = "启用";
   this.applyCheckBox.toolTip = "<p>启用瑕疵校正。</p>";
   this.applyCheckBox.onCheck = function( checked )
   {
      engine.cosmeticCorrection = checked;
      var lightsPage = this.dialog.tabBox.pageControlByIndex( ImageType.LIGHT );
      lightsPage.cosmeticCorrectionControl.updateControls();
   };

   this.applySizer = new HorizontalSizer;
   this.applySizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.applySizer.add( this.applyCheckBox );
   this.applySizer.addStretch();

   //

   var templateIconIdToolTip = "<p>标记一个现有的瑕疵校准图标作为模板，" +
      "从而可以将一个瑕疵校正程序应用到校准帧集合。" +
      "瑕疵校准将在正常的校准程序之后，反拜尔(deBayering，当需要时)和对齐之前执行。</p>";

   this.templateIconIdLabel = new Label( this );
   this.templateIconIdLabel.text = "模板图标:";
   this.templateIconIdLabel.minWidth = this.dialog.labelWidth1;
   this.templateIconIdLabel.toolTip = templateIconIdToolTip;
   this.templateIconIdLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.templateIconIdComboBox = new ComboBox( this );
   this.templateIconIdComboBox.toolTip = templateIconIdToolTip;
   this.templateIconIdComboBox.addItem( "<none>" );
   var icons = ProcessInstance.iconsByProcessId( "CosmeticCorrection" );
   if ( !engine.cosmeticCorrectionTemplateId.isEmpty() )
      if ( !icons.has( engine.cosmeticCorrectionTemplateId ) )
         this.templateIconIdComboBox.addItem( engine.cosmeticCorrectionTemplateId );
   for ( var i = 0; i < icons.length; ++i )
      this.templateIconIdComboBox.addItem( icons[i] );
   this.templateIconIdComboBox.onItemSelected = function( item )
   {
      if ( this.itemText( item ) == "<none>" )
         engine.cosmeticCorrectionTemplateId = "";
      else
         engine.cosmeticCorrectionTemplateId = this.itemText( item );
   };

   this.templateIconIdSizer = new HorizontalSizer;
   this.templateIconIdSizer.spacing = 4;
   this.templateIconIdSizer.add( this.templateIconIdLabel );
   this.templateIconIdSizer.add( this.templateIconIdComboBox, 100 );

   //

   this.add( this.applySizer );
   this.add( this.templateIconIdSizer );

   this.updateControls = function()
   {
      this.applyCheckBox.checked = engine.cosmeticCorrection;
      this.templateIconIdLabel.enabled = engine.cosmeticCorrection;
      this.templateIconIdComboBox.enabled = engine.cosmeticCorrection;
      if ( engine.cosmeticCorrectionTemplateId.isEmpty() )
         this.templateIconIdComboBox.currentItem = 0;
      else
         this.templateIconIdComboBox.currentItem =
               this.templateIconIdComboBox.findItem( engine.cosmeticCorrectionTemplateId );
   };
}

CosmeticCorrectionControl.prototype = new Control;

// ----------------------------------------------------------------------------

function DeBayerControl( parent )
{
   this.__base__ = ParametersControl;
   this.__base__( "反拜尔(DeBayer)", parent );

   //

   this.bayerPatternLabel = new Label( this );
   this.bayerPatternLabel.text = "拜尔/马赛克模式:";
   this.bayerPatternLabel.minWidth = this.dialog.labelWidth1;
   this.bayerPatternLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.bayerPatternComboBox = new ComboBox( this );
   this.bayerPatternComboBox.addItem( "自动" );
   this.bayerPatternComboBox.addItem( "RGGB" );
   this.bayerPatternComboBox.addItem( "BGGR" );
   this.bayerPatternComboBox.addItem( "GBRG" );
   this.bayerPatternComboBox.addItem( "GRBG" );
   this.bayerPatternComboBox.addItem( "GRGB" );
   this.bayerPatternComboBox.addItem( "GBGR" );
   this.bayerPatternComboBox.addItem( "RGBG" );
   this.bayerPatternComboBox.addItem( "BGRG" );
   this.bayerPatternComboBox.onItemSelected = function( itemIndex )
   {
      engine.bayerPattern = itemIndex;
   };

   this.bayerPatternSizer = new HorizontalSizer;
   this.bayerPatternSizer.spacing = 4;
   this.bayerPatternSizer.add( this.bayerPatternLabel );
   this.bayerPatternSizer.add( this.bayerPatternComboBox, 100 );

   //

   this.debayerMethodLabel = new Label( this );
   this.debayerMethodLabel.text = "DeBayer方法:";
   this.debayerMethodLabel.minWidth = this.dialog.labelWidth1;
   this.debayerMethodLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.debayerMethodComboBox = new ComboBox( this );
   this.debayerMethodComboBox.addItem( "超级像素(SuperPixel)" );
   this.debayerMethodComboBox.addItem( "双线性(Bilinear)" );
   this.debayerMethodComboBox.addItem( "VNG" );
   this.debayerMethodComboBox.onItemSelected = function( itemIndex )
   {
      engine.debayerMethod = itemIndex;
   };

   this.debayerMethodSizer = new HorizontalSizer;
   this.debayerMethodSizer.spacing = 4;
   this.debayerMethodSizer.add( this.debayerMethodLabel );
   this.debayerMethodSizer.add( this.debayerMethodComboBox, 100 );

   //

   this.add( this.bayerPatternSizer );
   this.add( this.debayerMethodSizer );

   this.updateControls = function()
   {
      this.enabled = engine.cfaImages;
      this.bayerPatternComboBox.currentItem = engine.bayerPattern;
      this.debayerMethodComboBox.currentItem = engine.debayerMethod;
   };
}

DeBayerControl.prototype = new Control;

// ----------------------------------------------------------------------------

function ImageRegistrationControl( parent, expand )
{
   this.__base__ = ParametersControl;
   this.__base__( "图像对齐", parent, expand );

   this.pixelInterpolationLabel = new Label( this );
   this.pixelInterpolationLabel.text = "像素插值算法:";
   this.pixelInterpolationLabel.minWidth = this.dialog.labelWidth1;
   this.pixelInterpolationLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.pixelInterpolationComboBox = new ComboBox( this );
   this.pixelInterpolationComboBox.addItem( "近邻法(Nearest Neighbor)" );
   this.pixelInterpolationComboBox.addItem( "双线性法(Bilinear)" );
   this.pixelInterpolationComboBox.addItem( "双三次样条法(Bicubic Spline)" );
   this.pixelInterpolationComboBox.addItem( "双三次B样条法(Bicubic B-Spline)" );
   this.pixelInterpolationComboBox.addItem( "Lanczos-3" );
   this.pixelInterpolationComboBox.addItem( "Lanczos-4" );
   this.pixelInterpolationComboBox.addItem( "Lanczos-5" );
   this.pixelInterpolationComboBox.addItem( "Mitchell-Netravali Filter" );
   this.pixelInterpolationComboBox.addItem( "Catmul-Rom Spline Filter" );
   this.pixelInterpolationComboBox.addItem( "三次B样条过滤(Cubic B-Spline Filter)" );
   this.pixelInterpolationComboBox.addItem( "自动" );
   this.pixelInterpolationComboBox.currentItem = engine.pixelInterpolation;
   this.pixelInterpolationComboBox.onItemSelected = function( item )
   {
      engine.pixelInterpolation = item;
   };

   this.pixelInterpolationSizer = new HorizontalSizer;
   this.pixelInterpolationSizer.spacing = 4;
   this.pixelInterpolationSizer.add( this.pixelInterpolationLabel );
   this.pixelInterpolationSizer.add( this.pixelInterpolationComboBox, 100 );

   //

   this.clampingThresholdControl = new NumericControl( this );
   this.clampingThresholdControl.label.text = "Clamping阈值:";
   this.clampingThresholdControl.label.minWidth = this.dialog.labelWidth1;
   this.clampingThresholdControl.setRange( 0, 1 );
   this.clampingThresholdControl.slider.setRange( 0, 1000 );
   this.clampingThresholdControl.slider.scaledMinWidth = 200;
   this.clampingThresholdControl.setPrecision( 2 );
   this.clampingThresholdControl.setValue( engine.clampingThreshold );
   this.clampingThresholdControl.edit.setFixedWidth( this.dialog.numericEditWidth );
   this.clampingThresholdControl.toolTip = "<p>双三次样条的Clamping阈值和Lanczos插值算法。</p>";
   this.clampingThresholdControl.onValueUpdated = function( value )
   {
      engine.clampingThreshold = value;
   };

   //

   this.maxStarsLabel = new Label( this );
   this.maxStarsLabel.text = "星点最大值:";
   this.maxStarsLabel.minWidth = this.dialog.labelWidth1;
   this.maxStarsLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.maxStarsSpinBox = new SpinBox( this );
   this.maxStarsSpinBox.minValue = 0; // <Auto>
   this.maxStarsSpinBox.maxValue = 262144;
   this.maxStarsSpinBox.minimumValueText = "<Auto>";
   this.maxStarsSpinBox.toolTip = "<p>图像对齐所允许的最大星点数。</p>" +
      "<p>默认情况下，BatchPreprocessing脚本将StarAlignment进程限制为每个图像中500个最亮的星点。" +
      "通常，这足以在没有差异失真的情况下为相似图像实现精确对齐。</p>" +
      "<p>如果图像遭受场失真，并且数据集包含明显移位或旋转的帧，例如受中天翻转影响的帧，" +
      "则应启用失真校正选项。 在这种情况下，此参数将被忽略，StarAlignment工具将自动选择所需的星点。</p>";
   this.maxStarsSpinBox.onValueUpdated = function( value )
   {
      engine.maxStars = value;
   };

   this.maxStarsSizer = new HorizontalSizer;
   this.maxStarsSizer.spacing = 4;
   this.maxStarsSizer.add( this.maxStarsLabel );
   this.maxStarsSizer.add( this.maxStarsSpinBox );
   this.maxStarsSizer.addStretch();

   //

   this.distortionCorrectionCheckBox = new CheckBox( this );
   this.distortionCorrectionCheckBox.text = "变形校准";
   this.distortionCorrectionCheckBox.toolTip = "<p>选中此选项以启用StarAlignment的失真校正算法。</p>" +
      "<p>需要此功能来校正诸如桶形、枕形和横向色差之类的非线性畸变，以及校正场差曲率和光学畸变，" +
      "这些畸变通常出现在马赛克和显著移位或旋转的帧中（例如，中天翻转的帧）。</p>" +
      "<p>畸变校正需要使用薄板样条(TPS，Thin Plate Splines)和大量的PSF星点配合，因此，与投射变换相比，" +
      "它可能比正常对齐要慢得多。对于需要更多控制的困难情况，请选中<i>仅校准</i>选项，并在校准后手动对齐图像。</p>";
   this.distortionCorrectionCheckBox.__parentControl__ = this;
   this.distortionCorrectionCheckBox.onCheck = function( checked )
   {
      engine.distortionCorrection = checked;
      this.__parentControl__.updateControls();
   };

   this.distortionCorrectionSizer = new HorizontalSizer;
   this.distortionCorrectionSizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.distortionCorrectionSizer.add( this.distortionCorrectionCheckBox );
   this.distortionCorrectionSizer.addStretch();

   //

   this.noiseReductionFilterRadiusLabel = new Label( this );
   this.noiseReductionFilterRadiusLabel.text = "降噪:";
   this.noiseReductionFilterRadiusLabel.minWidth = this.dialog.labelWidth1;
   this.noiseReductionFilterRadiusLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.noiseReductionFilterRadiusSpinBox = new SpinBox( this );
   this.noiseReductionFilterRadiusSpinBox.minValue = 0; // <Auto>
   this.noiseReductionFilterRadiusSpinBox.maxValue = 50;
   this.noiseReductionFilterRadiusSpinBox.minimumValueText = "<禁用>";
   this.noiseReductionFilterRadiusSpinBox.toolTip =
      "<p>降噪过滤器的大小。</p>" +
      "<p>这是在恒星检测阶段，用于计算恒星位置的图像，其高斯卷积滤波器的半径（以像素为单位）。" +
      "仅将其用于非常低的SNR图像，在该图像中，恒星检测器无法找到具有默认参数的可靠恒星。请注意，" +
      "降噪会改变恒星轮廓，因此会改变恒星位置的计算方式。但是，在极低的SNR条件下，" +
      "这可能总比处理实际数据要好。</p>" +
      "<p>要禁用降噪，请将此参数设置为零。</p>";
   this.noiseReductionFilterRadiusSpinBox.onValueUpdated = function( value )
   {
      engine.noiseReductionFilterRadius = value;
   };

   this.noiseReductionFilterRadiusSizer = new HorizontalSizer;
   this.noiseReductionFilterRadiusSizer.spacing = 4;
   this.noiseReductionFilterRadiusSizer.add( this.noiseReductionFilterRadiusLabel );
   this.noiseReductionFilterRadiusSizer.add( this.noiseReductionFilterRadiusSpinBox );
   this.noiseReductionFilterRadiusSizer.addStretch();

   //

   this.useTriangleSimilarityCheckBox = new CheckBox( this );
   this.useTriangleSimilarityCheckBox.text = "使用三角形相似度";
   this.useTriangleSimilarityCheckBox.toolTip = "<p>如果选中此选项，则图像对齐过程将在星点匹配程序中，" +
      "使用三角形相似度而不是多边形描述符来进行匹配。</p>" +
      "<p>多边形描述符更健壮和准确，但无法对齐要进行镜面变换（水平和垂直镜）的图像。" +
      "三角形相似度在正常情况下效果很好，并且能够对齐镜像图像，因此它是BatchPreprocessing脚本中的默认选项。" +
      "如果您需要对图像对齐参数进行更多控制，请选中<i>仅校准</i>选项，并在校准后手动对齐图像。</p>";
   this.useTriangleSimilarityCheckBox.onCheck = function( checked )
   {
      engine.useTriangleSimilarity = checked;
   };

   this.useTriangleSimilaritySizer = new HorizontalSizer;
   this.useTriangleSimilaritySizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.useTriangleSimilaritySizer.add( this.useTriangleSimilarityCheckBox );
   this.useTriangleSimilaritySizer.addStretch();

   //

   this.add( this.pixelInterpolationSizer );
   this.add( this.clampingThresholdControl );
   this.add( this.maxStarsSizer );
   this.add( this.distortionCorrectionSizer );
   this.add( this.noiseReductionFilterRadiusSizer );
   this.add( this.useTriangleSimilaritySizer );

   this.updateControls = function()
   {
      this.enabled = !engine.calibrateOnly;
      this.pixelInterpolationComboBox.currentItem = engine.pixelInterpolation;
      this.clampingThresholdControl.setValue( engine.clampingThreshold );
      this.maxStarsSpinBox.value = engine.maxStars;
      this.maxStarsSpinBox.enabled = !engine.distortionCorrection;
      this.distortionCorrectionCheckBox.checked = engine.distortionCorrection;
      this.noiseReductionFilterRadiusSpinBox.value = engine.noiseReductionFilterRadius;
      this.useTriangleSimilarityCheckBox.checked = engine.useTriangleSimilarity;
   };
}

ImageRegistrationControl.prototype = new Control;

// ----------------------------------------------------------------------------

function LightsIntegrationControl( parent )
{
   this.__base__ = ParametersControl;
   this.__base__( "图像堆叠", parent );

   //

   this.applyCheckBox = new CheckBox( this );
   this.applyCheckBox.text = "启用";
   this.applyCheckBox.toolTip = "<p>在图像对齐后进行亮场帧的堆叠。</p>";
   this.applyCheckBox.onCheck = function( checked )
   {
      engine.integrate = checked;
      var lightsPage = this.dialog.tabBox.pageControlByIndex( ImageType.LIGHT );
      lightsPage.lightsIntegrationControl.updateControls();
   };

   this.applySizer = new HorizontalSizer;
   this.applySizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.applySizer.add( this.applyCheckBox );
   this.applySizer.addStretch();

   //

   this.editButton = new PushButton( this );
   this.editButton.text = "堆叠参数...";
   this.editButton.icon = this.scaledResource( ":/icons/arrow-right.png" );
   this.editButton.toolTip = "<p>编辑图像堆叠参数。</p>";
   this.editButton.onClick = function()
   {
      var lightsPage = this.dialog.tabBox.pageControlByIndex( ImageType.LIGHT );
      lightsPage.imageIntegrationControl.show();
   };

   this.editSizer = new HorizontalSizer;
   this.editSizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.editSizer.add( this.editButton, 100 );

   //

   this.add( this.applySizer );
   this.add( this.editSizer );

   this.updateControls = function()
   {
      this.enabled = !engine.calibrateOnly;
      this.applyCheckBox.checked = engine.integrate;
      this.editButton.enabled = engine.integrate;
   };
}

LightsIntegrationControl.prototype = new Control;

// ----------------------------------------------------------------------------

function LightsRegistrationControl( parent )
{
   this.__base__ = ParametersControl;
   this.__base__( "图像对齐", parent );

   //

   this.generateDrizzleDataCheckBox = new CheckBox( this );
   this.generateDrizzleDataCheckBox.text = "生成Drizzle数据";
   this.generateDrizzleDataCheckBox.toolTip = "<p>在图像对齐任务中生成.xdrz文件。" +
         "这个文件能够让你在后面使用ImageIntegration和DrizzleIntegration工具时，" +
         "执行一个Drizzle堆叠程序。</p>";
   this.generateDrizzleDataCheckBox.onCheck = function( checked )
   {
      engine.generateDrizzleData = checked;
      var lightsPage = this.dialog.tabBox.pageControlByIndex( ImageType.LIGHT );
      lightsPage.deBayeringControl.updateControls();
   };

   this.generateDrizzleDataSizer = new HorizontalSizer;
   this.generateDrizzleDataSizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.generateDrizzleDataSizer.add( this.generateDrizzleDataCheckBox );
   this.generateDrizzleDataSizer.addStretch();

   //

   this.editButton = new PushButton( this );
   this.editButton.text = "对齐参数...";
   this.editButton.icon = this.scaledResource( ":/icons/arrow-right.png" );
   this.editButton.toolTip = "<p>编辑图像对齐参数。</p>";
   this.editButton.onClick = function()
   {
      var lightsPage = this.dialog.tabBox.pageControlByIndex( ImageType.LIGHT );
      lightsPage.imageRegistrationControl.show();
   };

   this.editSizer = new HorizontalSizer;
   this.editSizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.editSizer.add( this.editButton, 100 );

   //

   this.add( this.generateDrizzleDataSizer );
   this.add( this.editSizer );

   this.updateControls = function()
   {
      this.generateDrizzleDataCheckBox.checked = engine.generateDrizzleData;
      this.enabled = !engine.calibrateOnly;
   };
}

LightsRegistrationControl.prototype = new Control;

// ----------------------------------------------------------------------------

function FileControl( parent, imageType )
{
   this.__base__ = Control;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.treeBox = new StyledTreeBox( this );
   this.treeBox.multipleSelection = true;
   this.treeBox.numberOfColumns = 1;
   this.treeBox.headerVisible = false;
   this.treeBox.setScaledMinWidth( 250 );

   //

   this.clearButton = new PushButton( this );
   this.clearButton.text = "清除";
   this.clearButton.icon = this.scaledResource( ":/icons/clear.png" );
   this.clearButton.toolTip = "<p>清除当前列表中的所有文件。</p>";
   this.clearButton.onClick = function()
   {
      this.dialog.clearTab( this.dialog.tabBox.currentPageIndex );
   };

   this.removeSelectedButton = new PushButton( this );
   this.removeSelectedButton.text = "移除选定项";
   this.removeSelectedButton.icon = this.scaledResource( ":/icons/clear.png" );
   this.removeSelectedButton.toolTip = "<p>移除当前列表中被选中的那些文件。</p>";
   this.removeSelectedButton.onClick = function()
   {
      var tree = this.dialog.tabBox.pageControlByIndex( this.dialog.tabBox.currentPageIndex ).treeBox;
      var selected = tree.selectedNodes;
      for ( var step = 0; step < 2; ++step )
         for ( var i = 0; i < selected.length; ++i )
         {
            var node = selected[i];
            if ( step == 0 )
            {
               if ( node.nodeData_type == "FileItem" )
                  engine.frameGroups[node.parent.nodeData_index].fileItems[node.nodeData_index] = null;
            }
            else
            {
               if ( node.nodeData_type == "FrameGroup" )
                  engine.frameGroups[node.nodeData_index] = null;
            }
         }
      engine.purgeRemovedElements();
      this.dialog.refreshTreeBoxes();
   };

   this.invertSelectionButton = new PushButton( this );
   this.invertSelectionButton.text = "反选";
   this.invertSelectionButton.icon = this.scaledResource( ":/icons/select-invert.png" );
   this.invertSelectionButton.toolTip = "<p>反选当前列表中的文件。</p>";
   this.invertSelectionButton.onClick = function()
   {
      function invertNodeSelection( node )
      {
         node.selected = !node.selected;
         for ( var i = 0; i < node.numberOfChildren; ++i )
            invertNodeSelection( node.child( i ) );
      }

      var tree = this.dialog.tabBox.pageControlByIndex( this.dialog.tabBox.currentPageIndex ).treeBox;
      for ( var i = 0; i < tree.numberOfChildren; ++i )
         invertNodeSelection( tree.child( i ) );
   };

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.spacing = 6;
   this.buttonsSizer.add( this.clearButton );
   this.buttonsSizer.add( this.removeSelectedButton );
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.invertSelectionButton );

   //

   this.rightPanelSizer = new VerticalSizer;
   this.rightPanelSizer.add( this.buttonsSizer );
   this.rightPanelSizer.addSpacing( 8 );
   this.rightPanelSizer.addStretch();

   switch ( imageType )
   {
   case ImageType.BIAS:

      this.biasOverscanControl = new BiasOverscanControl( this );
      this.overscanControl = new OverscanControl( this, true/*expand*/ );

      this.rightPanelSizer.add( this.biasOverscanControl );
      this.rightPanelSizer.addSpacing( 8 );
      this.rightPanelSizer.add( this.overscanControl );

      this.imageIntegrationControl = new ImageIntegrationControl( this, ImageType.BIAS );
      this.rightPanelSizer.add( this.imageIntegrationControl );

      this.restyle();
      break;

   case ImageType.DARK:

      this.darkOptimizationThresholdControl = new NumericControl( this );
      this.darkOptimizationThresholdControl.label.text = "优化阈值:";
      this.darkOptimizationThresholdControl.label.minWidth = this.dialog.labelWidth1
                                          + this.dialog.logicalPixelsToPhysical( 6 ); // + integration control margin
      this.darkOptimizationThresholdControl.setRange( 0, 10 );
      this.darkOptimizationThresholdControl.slider.setRange( 0, 200 );
      //this.darkOptimizationThresholdControl.slider.scaledMinWidth = 200;
      this.darkOptimizationThresholdControl.setPrecision( 4 );
      this.darkOptimizationThresholdControl.toolTip = "<p>暗场优化像素集的下限，以中位数的标准差单位计量。</p>" +
         "<p>此参数定义了一组暗场帧像素，这些像素将用于自适应地计算暗场优化因子。通过将此设置限制为相对较亮的像素，" +
         "优化过程可以更健壮，以读出存在于主偏置和暗场帧中的噪声。增大此参数可从优化集中删除更多暗像素。</p>";
      this.darkOptimizationThresholdControl.onValueUpdated = function( value )
      {
         engine.darkOptimizationLow = value;
      };

      this.rightPanelSizer.add( this.darkOptimizationThresholdControl );
      this.rightPanelSizer.addSpacing( 4 );

      //

      this.darkOptimizationWindowLabel = new Label( this );
      this.darkOptimizationWindowLabel.text = "优化窗口:";
      this.darkOptimizationWindowLabel.minWidth = this.dialog.labelWidth1
                                          + this.dialog.logicalPixelsToPhysical( 6 ); // + integration control margin
      this.darkOptimizationWindowLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

      this.darkOptimizationWindowSpinBox = new SpinBox( this );
      this.darkOptimizationWindowSpinBox.minValue = 0;
      this.darkOptimizationWindowSpinBox.maxValue = 65536;
      this.darkOptimizationWindowSpinBox.setFixedWidth( this.dialog.numericEditWidth + this.logicalPixelsToPhysical( 16 ) );
      this.darkOptimizationWindowSpinBox.toolTip = "<p>此参数是暗场优化过程中，用于计算噪声估计的正方形区域的大小（以像素为单位）。" +
         "正方形区域以每个目标图像为中心。默认情况下，使用的<i>窗口</i>为一百万像素（1024x1024像素）。</p>" +
         "<p>通过使用减少的像素子集，暗场优化过程可以更快，并且出于暗帧缩放的目的，对缩小区域的噪声评估通常与对整个图像的噪声评估一样准确。</p>" +
         "<p>要禁用此功能，从而使用整个图像来计算噪声评估，请选择零窗口大小。 如果选择的窗口尺寸大于目标图像的尺寸，则此功能也会被忽略，" +
         "并将整个图像用于噪声评估。</p>";
      this.darkOptimizationWindowSpinBox.onValueUpdated = function( value )
      {
         engine.darkOptimizationWindow = value;
      };

      this.darkOptimizationWindowSizer = new HorizontalSizer;
      this.darkOptimizationWindowSizer.spacing = 4;
      this.darkOptimizationWindowSizer.add( this.darkOptimizationWindowLabel );
      this.darkOptimizationWindowSizer.add( this.darkOptimizationWindowSpinBox );
      this.darkOptimizationWindowSizer.addStretch();

      this.rightPanelSizer.add( this.darkOptimizationWindowSizer );
      this.rightPanelSizer.addSpacing( 4 );

      //

      this.darkExposureToleranceLabel = new Label( this );
      this.darkExposureToleranceLabel.text = "曝光宽容度:";
      this.darkExposureToleranceLabel.minWidth = this.dialog.labelWidth1
                                          + this.dialog.logicalPixelsToPhysical( 6 ); // + integration control margin
      this.darkExposureToleranceLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

      this.darkExposureToleranceSpinBox = new SpinBox( this );
      this.darkExposureToleranceSpinBox.minValue = 0;
      this.darkExposureToleranceSpinBox.maxValue = 600;
      this.darkExposureToleranceSpinBox.setFixedWidth( this.dialog.numericEditWidth + this.logicalPixelsToPhysical( 16 ) );
      this.darkExposureToleranceSpinBox.toolTip = "<p>曝光时间差异小于此值（以秒为单位）的暗帧将被分组在一起。</p>";
      this.darkExposureToleranceSpinBox.onValueUpdated = function( value )
      {
         engine.darkExposureTolerance = value;
      };

      this.darkExposureToleranceSizer = new HorizontalSizer;
      this.darkExposureToleranceSizer.spacing = 4;
      this.darkExposureToleranceSizer.add( this.darkExposureToleranceLabel );
      this.darkExposureToleranceSizer.add( this.darkExposureToleranceSpinBox );
      this.darkExposureToleranceSizer.addStretch();

      this.rightPanelSizer.add( this.darkExposureToleranceSizer );
      this.rightPanelSizer.addSpacing( 8 );

      //

      this.imageIntegrationControl = new ImageIntegrationControl( this, ImageType.DARK );
      this.rightPanelSizer.add( this.imageIntegrationControl );

      this.restyle();
      break;

   case ImageType.FLAT:

     //

      this.flatDarksOnlyCheckBox = new CheckBox( this );
      this.flatDarksOnlyCheckBox.checked = engine.flatDarksOnly;
      this.flatDarksOnlyCheckBox.text = "只使用暗平场校准";
      this.flatDarksOnlyCheckBox.toolTip = "<p>仅在提供相同曝光时间的暗场（暗平场）时，才执行平场帧校准。" +
      "由于存在不可忽略的残留物（例如辉光），如果用于校准曝光时间明显不同的暗场时，则结果会非常的不可靠。</p>";
      this.flatDarksOnlyCheckBox.onCheck = function( checked )
      {
         engine.flatDarksOnly = checked;
      };

      this.flatDarksOnlySizer = new HorizontalSizer;
      this.flatDarksOnlySizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 6+4 ) );
      this.flatDarksOnlySizer.add( this.flatDarksOnlyCheckBox );
      this.flatDarksOnlySizer.addStretch();

      //

      this.rightPanelSizer.add( this.flatDarksOnlySizer );
      this.rightPanelSizer.addSpacing( 8 );

      this.imageIntegrationControl = new ImageIntegrationControl( this, ImageType.FLAT );
      this.rightPanelSizer.add( this.imageIntegrationControl );

      this.restyle();
      break;

   case ImageType.LIGHT:

      this.calibrateOnlyCheckBox = new CheckBox( this );
      this.calibrateOnlyCheckBox.text = "仅校准";
      this.calibrateOnlyCheckBox.toolTip = "<p>仅校准 —— 不执行图像对齐和堆叠任务。</p>";
      this.calibrateOnlyCheckBox.onCheck = function( checked )
      {
         engine.calibrateOnly = checked;
         var lightsPage = this.dialog.tabBox.pageControlByIndex( ImageType.LIGHT );
         lightsPage.lightsRegistrationControl.updateControls();
         lightsPage.imageRegistrationControl.updateControls();
         lightsPage.lightsIntegrationControl.updateControls();
         lightsPage.imageIntegrationControl.updateControls();
      };

      this.calibrateOnlySizer = new HorizontalSizer;
      this.calibrateOnlySizer.addUnscaledSpacing( this.dialog.labelWidth1 + this.logicalPixelsToPhysical( 4+6 ) ); // + spacing + integration control margin
      this.calibrateOnlySizer.add( this.calibrateOnlyCheckBox );
      this.calibrateOnlySizer.addStretch();

      this.cosmeticCorrectionControl = new CosmeticCorrectionControl( this );
      this.deBayeringControl = new DeBayerControl( this );
      this.lightsRegistrationControl = new LightsRegistrationControl( this );
      this.imageRegistrationControl = new ImageRegistrationControl( this, true/*expand*/ );
      this.lightsIntegrationControl = new LightsIntegrationControl( this );
      this.imageIntegrationControl = new ImageIntegrationControl( this, ImageType.LIGHT, true/*expand*/ );

      this.rightPanelSizer.add( this.calibrateOnlySizer );
      this.rightPanelSizer.addSpacing( 8 );
      this.rightPanelSizer.add( this.cosmeticCorrectionControl );
      this.rightPanelSizer.addSpacing( 8 );
      this.rightPanelSizer.add( this.deBayeringControl );
      this.rightPanelSizer.addSpacing( 8 );
      this.rightPanelSizer.add( this.lightsRegistrationControl );
      this.rightPanelSizer.add( this.imageRegistrationControl );
      this.rightPanelSizer.addSpacing( 8 );
      this.rightPanelSizer.add( this.lightsIntegrationControl );
      this.rightPanelSizer.add( this.imageIntegrationControl );

      this.restyle();
      this.lightsRegistrationControl.minWidth =
         this.dialog.tabBox.pageControlByIndex( ImageType.BIAS ).imageIntegrationControl.width;
      break;
   }

   //

   this.sizer = new HorizontalSizer;
   this.sizer.margin = 8;
   this.sizer.add( this.treeBox, 100 );
   this.sizer.addSpacing( 12 );
   this.sizer.add( this.rightPanelSizer );
}

FileControl.prototype = new Control;

// ----------------------------------------------------------------------------

function ResetDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   this.resetParametersRadioButton = new RadioButton( this );
   this.resetParametersRadioButton.text = "重置所有参数到默认值";

   this.reloadSettingsRadioButton = new RadioButton( this );
   this.reloadSettingsRadioButton.text = "重载最后一次保存的设置";
   this.reloadSettingsRadioButton.checked = true;

   this.clearFileListsCheckBox = new CheckBox( this );
   this.clearFileListsCheckBox.text = "清除所有文件列表";
   this.clearFileListsCheckBox.checked = false;

   //

   this.okButton = new PushButton( this );
   this.okButton.defaultButton = true;
   this.okButton.text = "确定";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancelButton = new PushButton( this );
   this.cancelButton.text = "取消";
   this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelButton.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.okButton );
   this.buttonsSizer.addSpacing( 8 );
   this.buttonsSizer.add( this.cancelButton );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( this.resetParametersRadioButton );
   this.sizer.add( this.reloadSettingsRadioButton );
   this.sizer.add( this.clearFileListsCheckBox );
   this.sizer.add( this.buttonsSizer );

   this.adjustToContents();
   this.setFixedSize();

   this.windowTitle = "重置预处理引擎";
}

ResetDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

function SelectCustomFilesDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.imageType = ImageType.UNKNOWN;
   this.filter = "?"; // ### see StackEngine.addFile()
   this.binning = 0;
   this.exposureTime = 0;
   this.files = new Array;

   var labelWidth1 = this.font.width( "曝光时间(秒):" + "M" );

   //

   this.fileListLabel = new Label( this );
   this.fileListLabel.text = "选择文件";

   this.fileList = new StyledTreeBox( this );
   this.fileList.numberOfColumns = 1;
   this.fileList.headerVisible = false;
   this.fileList.setScaledMinSize( 400, 250 );

   this.addButton = new PushButton( this );
   this.addButton.text = "添加文件";
   this.addButton.icon = this.scaledResource( ":/icons/add.png" );
   this.addButton.toolTip = "<p>添加文件到文件列表中。</p>";
   this.addButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "选择图像";
      ofd.loadImageFilters();
      if ( ofd.execute() )
      {
         for ( var i = 0; i < ofd.fileNames.length; ++i )
            this.dialog.files.push( ofd.fileNames[i] );
         this.dialog.updateFileList();
      }
   };

   this.clearButton = new PushButton( this );
   this.clearButton.text = "清除";
   this.clearButton.icon = this.scaledResource( ":/icons/clear.png" );
   this.clearButton.toolTip = "<p>清除当前列表中的文件。</p>";
   this.clearButton.onClick = function()
   {
      this.dialog.files = new Array;
      this.dialog.updateFileList();
   };

   this.fileButtonsSizer = new HorizontalSizer;
   this.fileButtonsSizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.fileButtonsSizer.add( this.addButton );
   this.fileButtonsSizer.addSpacing( 8 );
   this.fileButtonsSizer.add( this.clearButton );
   this.fileButtonsSizer.addStretch();

   //

   var imageTypeToolTip = "<p>帧类型。可以选择'?'，程序会尝试自动判断帧类型。</p>";

   this.imageTypeLabel = new Label( this );
   this.imageTypeLabel.text = "图像类型:";
   this.imageTypeLabel.minWidth = labelWidth1;
   this.imageTypeLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.imageTypeLabel.toolTip = imageTypeToolTip;

   this.imageTypeComboBox = new ComboBox( this );
   this.imageTypeComboBox.addItem( "?" );
   this.imageTypeComboBox.addItem( "偏置帧" );
   this.imageTypeComboBox.addItem( "暗场帧" );
   this.imageTypeComboBox.addItem( "平场帧" );
   this.imageTypeComboBox.addItem( "亮场帧" );
   this.imageTypeComboBox.currentItem = this.imageType + 1; // ImageType property -> combobox item
   this.imageTypeComboBox.toolTip = imageTypeToolTip;
   this.imageTypeComboBox.onItemSelected = function( item )
   {
      this.dialog.imageType = item - 1; // combobox item -> ImageType property
   };

   this.imageTypeSizer = new HorizontalSizer;
   this.imageTypeSizer.spacing = 4;
   this.imageTypeSizer.add( this.imageTypeLabel );
   this.imageTypeSizer.add( this.imageTypeComboBox, 100 );

   //

   var filterToolTip = "<p>滤镜名称。可以选择'?'，程序会尝试自动判断是什么滤镜。</p>";

   this.filterLabel = new Label( this );
   this.filterLabel.text = "滤镜名称:";
   this.filterLabel.minWidth = labelWidth1;
   this.filterLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.filterLabel.toolTip = filterToolTip;

   this.filterEdit = new Edit( this );
   this.filterEdit.text = this.filter;
   this.filterEdit.toolTip = filterToolTip;
   this.filterEdit.onEditCompleted = function()
   {
      this.text = this.dialog.filter = this.text.trim();
   };

   this.filterSizer = new HorizontalSizer;
   this.filterSizer.spacing = 4;
   this.filterSizer.add( this.filterLabel );
   this.filterSizer.add( this.filterEdit, 100 );

   //

   var binningToolTip = "<p>像素合并。选择0时，程序会尝试自动判断像素合并的值。</p>";

   this.binningLabel = new Label( this );
   this.binningLabel.text = "像素合并:";
   this.binningLabel.minWidth = labelWidth1;
   this.binningLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.binningLabel.toolTip = binningToolTip;

   this.binningSpinBox = new SpinBox( this );
   this.binningSpinBox.minValue = 0;
   this.binningSpinBox.maxValue = 4;
   this.binningSpinBox.value = this.binning;
   this.binningSpinBox.toolTip = binningToolTip;
   this.binningSpinBox.onValueUpdated = function( value )
   {
      this.dialog.binning = value;
   };

   this.binningSizer = new HorizontalSizer;
   this.binningSizer.spacing = 4;
   this.binningSizer.add( this.binningLabel );
   this.binningSizer.add( this.binningSpinBox );
   this.binningSizer.addStretch();

   //

   this.exposureTimeEdit = new NumericEdit( this );
   this.exposureTimeEdit.label.text = "曝光时间(秒):";
   this.exposureTimeEdit.label.minWidth = labelWidth1;
   this.exposureTimeEdit.setRange( 0, 999999 );
   this.exposureTimeEdit.setPrecision( 2 );
   this.exposureTimeEdit.setValue( this.exposureTime );
   this.exposureTimeEdit.toolTip = "<p>曝光时间，单位：秒。选择0，程序会尝试自动判断曝光时间。</p>";
   this.exposureTimeEdit.sizer.addStretch();
   this.exposureTimeEdit.onValueUpdated = function( value )
   {
      this.dialog.exposureTime = value;
   };

   //

   this.okButton = new PushButton( this );
   this.okButton.defaultButton = true;
   this.okButton.text = "确定";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancelButton = new PushButton( this );
   this.cancelButton.text = "取消";
   this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelButton.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.buttonsSizer.add( this.okButton );
   this.buttonsSizer.addSpacing( 8 );
   this.buttonsSizer.add( this.cancelButton );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( this.fileListLabel );
   this.sizer.add( this.fileList, 100 );
   this.sizer.add( this.fileButtonsSizer );
   this.sizer.add( this.imageTypeSizer );
   this.sizer.add( this.filterSizer );
   this.sizer.add( this.binningSizer );
   this.sizer.add( this.exposureTimeEdit );
   this.sizer.add( this.buttonsSizer );

   this.adjustToContents();
   this.setMinSize();

   this.windowTitle = "添加自定义帧";

   this.updateFileList = function()
   {
      this.fileList.clear();
      for ( var i = 0; i < this.files.length; ++i )
      {
         var node = new TreeBoxNode;
         node.setText( 0, File.extractNameAndExtension( this.files[i] ) );
         node.setToolTip( 0, this.files[i] );
         this.fileList.add( node );
      }
   };
}

SelectCustomFilesDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

function StackDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.labelWidth1 = this.font.width( "拜尔/马赛克模式:" + "M" );
   this.textEditWidth = 25 * this.font.width( "M" );
   this.numericEditWidth = 6 * this.font.width( "0" );
   this.suffixEditWidth = 10 * this.font.width( "M" );

   this.setScaledMinHeight( 500 );

   // Force an update of all dialog styling properties (fonts, colors, margins,
   // etc.). This is necessary in this case to ensure proper styling of complex
   // child controls.
   this.restyle();

   //

   this.helpLabel = new Label( this );
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p>一个用于校准和对齐亮场的脚本<br/>"
    + "Copyright (c) 2012 Kai Wiechen.<br/>"
    + "Copyright (c) 2012-2019 Pleiades Astrophoto.</p>";

   //

   this.helpButton = new ToolButton( this );
   this.helpButton.icon = this.scaledResource( ":/icons/comment.png" );
   this.helpButton.setScaledFixedSize( 20, 20 );
   this.helpButton.toolTip =
     "<p><b>1.</b> 选择偏置场标签，然后添加原始的偏置场，或者添加处理好的主偏置场(需要选中<i>“使用主偏置场”</i>)。</p>"
   + "<p><b>2.</b> 选择暗场标签，然后重复上面第一步的操作。</p>"
   + "<p><b>3.</b> 选择平场标签，然后再一次重复上面第一步的操作。如果你的亮场使用了滤镜拍摄，则需要将对应滤镜的平场都添加进来。</p>"
   + "<p><b>4.</b> 选择亮场标签，然后将所有亮场帧都添加进来（你可以把所有通道的滤镜亮场一次性添加进来）。</p>"
   + "<p><b>5.</b> 选择一个亮场帧作为<i>对齐参考帧</i>。你只需要在亮场列表中双击你选中用做参考的亮场帧就可以完成这个操作。</p>"
   + "<p><b>6.</b> 选择一个输出文件夹(用来保存处理成果)。</p>"
   + "<p><b>7.</b> 点击“运行”，然后去喝杯咖啡，或者找个妹子勾搭一会儿。</p>"
   + "<p><b>8.</b> 本脚本将会把校准的和对齐的亮场帧都保存到输出文件夹中。如果图像使用了滤镜拍摄，则不同滤镜会分别保存在相应的子文件夹中。</p>";

   //

   this.tabBox = new TabBox( this );

   this.tabBox.addPage( new FileControl( this, ImageType.BIAS ),  "偏置" );
   this.tabBox.addPage( new FileControl( this, ImageType.DARK ),  "暗场" );
   this.tabBox.addPage( new FileControl( this, ImageType.FLAT ),  "平场" );
   this.tabBox.addPage( new FileControl( this, ImageType.LIGHT ), "亮场" );
   this.tabBox.currentPageIndex = 3;

   // Handle click on file name -> set registration reference image
   this.tabBox.pageControlByIndex( ImageType.LIGHT ).treeBox.onNodeDoubleClicked = function( node, column )
   {
      // We create a nodeData_filePath property for each TreeBox node to store
      // the full path of the corresponding frame group element.
      // -- See refreshTreeBoxes()
      if ( node.nodeData_filePath )
         if ( !node.nodeData_filePath.isEmpty() )
         {
            engine.referenceImage = node.nodeData_filePath;
            this.dialog.referenceImageEdit.text = node.nodeData_filePath;
         }
   };

   //

   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 24, 24 );
   this.newInstanceButton.toolTip = "新实例";
   this.newInstanceButton.onMousePress = function()
   {
      this.hasFocus = true;
      engine.exportParameters();
      this.pushed = false;
      this.dialog.newInstance();
   };

   //

   this.fileAddButton = new PushButton( this );
   this.fileAddButton.text = "添加文件";
   this.fileAddButton.icon = this.scaledResource( ":/icons/add.png" );
   this.fileAddButton.toolTip = "<p>添加文件到文件列表。</p>" +
         "<p>文件类型会根据XISF图像属性或者FITS关键字自动选择。</p>";
   this.fileAddButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "选择图像";
      ofd.loadImageFilters();
      if ( ofd.execute() )
      {
         var n = 0;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
            if ( engine.addFile( ofd.fileNames[i] ) )
               ++n;
         this.dialog.refreshTreeBoxes();

         if ( n < ofd.fileNames.length )
         {
            engine.diagnosticMessages.unshift( format( "=== %d of %d frames were added ===", n, ofd.fileNames.length ) );
            engine.showDiagnosticMessages();
            engine.clearDiagnosticMessages();
         }
      }
   };

   this.biasAddButton = new PushButton( this );
   this.biasAddButton.text = "添加偏置场";
   this.biasAddButton.icon = this.scaledResource( ":/icons/add.png" );
   this.biasAddButton.toolTip = "<p>添加文件到偏置场列表。</p>" +
         "<p>文件将会被无条件的加入到偏置场列表中 —— 不会进行FITS关键字检查。</p>";
   this.biasAddButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "选择偏置帧";
      ofd.loadImageFilters();
      if ( ofd.execute() )
      {
         var n = 0;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
            if ( engine.addBiasFrame( ofd.fileNames[i] ) )
               ++n;
         this.dialog.refreshTreeBoxes();
         this.dialog.tabBox.currentPageIndex = ImageType.BIAS;

         if ( n < ofd.fileNames.length )
         {
            engine.diagnosticMessages.unshift( format( "=== %d of %d bias frames were added ===", n, ofd.fileNames.length ) );
            engine.showDiagnosticMessages();
            engine.clearDiagnosticMessages();
         }
      }
   };

   this.darkAddButton = new PushButton( this );
   this.darkAddButton.text = "添加暗场";
   this.darkAddButton.icon = this.scaledResource( ":/icons/add.png" );
   this.darkAddButton.toolTip = "<p>添加文件到暗场列表。</p>" +
         "<p>文件将会被无条件的加入到暗场列表中 —— 不会进行FITS关键字检查。</p>";
   this.darkAddButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "选择暗场帧";
      ofd.loadImageFilters();
      if ( ofd.execute() )
      {
         var n = 0;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
            if ( engine.addDarkFrame( ofd.fileNames[i] ) )
               ++n;
         this.dialog.refreshTreeBoxes();
         this.dialog.tabBox.currentPageIndex = ImageType.DARK;

         if ( n < ofd.fileNames.length )
         {
            engine.diagnosticMessages.unshift( format( "=== %d of %d dark frames were added ===", n, ofd.fileNames.length ) );
            engine.showDiagnosticMessages();
            engine.clearDiagnosticMessages();
         }
      }
   };

   this.flatAddButton = new PushButton( this );
   this.flatAddButton.text = "添加平场";
   this.flatAddButton.icon = this.scaledResource( ":/icons/add.png" );
   this.flatAddButton.toolTip = "<p>添加文件到平场列表。</p>" +
         "<p>文件将会被无条件的加入到平场列表中 —— 不会进行FITS关键字检查。</p>";
   this.flatAddButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "选择平场帧";
      ofd.loadImageFilters();
      if ( ofd.execute() )
      {
         var n = 0;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
            if ( engine.addFlatFrame( ofd.fileNames[i] ) )
               ++n;
         this.dialog.refreshTreeBoxes();
         this.dialog.tabBox.currentPageIndex = ImageType.FLAT;

         if ( n < ofd.fileNames.length )
         {
            engine.diagnosticMessages.unshift( format( "=== %d of %d flat frames were added ===", n, ofd.fileNames.length ) );
            engine.showDiagnosticMessages();
            engine.clearDiagnosticMessages();
         }
      }
   };

   this.lightAddButton = new PushButton( this );
   this.lightAddButton.text = "添加亮场";
   this.lightAddButton.icon = this.scaledResource( ":/icons/add.png" );
   this.lightAddButton.toolTip = "<p>添加文件到亮场列表。</p>" +
         "<p>文件将会被无条件的加入到亮场列表中 —— 不会进行FITS关键字检查。</p>";
   this.lightAddButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "选择亮场帧";
      ofd.loadImageFilters();
      if ( ofd.execute() )
      {
         var n = 0;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
            if ( engine.addLightFrame( ofd.fileNames[i] ) )
               ++n;
         this.dialog.refreshTreeBoxes();
         this.dialog.tabBox.currentPageIndex = ImageType.LIGHT;

         if ( n < ofd.fileNames.length )
         {
            engine.diagnosticMessages.unshift( format( "=== %d of %d light frames were added ===", n, ofd.fileNames.length ) );
            engine.showDiagnosticMessages();
            engine.clearDiagnosticMessages();
         }
      }
   };

   this.customAddButton = new PushButton( this );
   this.customAddButton.text = "添加自定义";
   this.customAddButton.icon = this.scaledResource( ":/icons/document-edit.png" );
   this.customAddButton.toolTip = "<p>添加自定义文件到自定义文件列表。<p>";
   this.customAddButton.onClick = function()
   {
      var d = new SelectCustomFilesDialog;
      if ( d.execute() )
      {
         var n = 0;
         for ( var i = 0; i < d.files.length; ++i )
            if ( engine.addFile( d.files[i], d.imageType, d.filter, d.binning, d.exposureTime ) )
               ++n;
         this.dialog.refreshTreeBoxes();
         this.dialog.tabBox.currentPageIndex = d.imageType;

         if ( n < d.files.length )
         {
            engine.diagnosticMessages.unshift( format( "=== %d of %d custom frames were added ===", n, d.files.length ) );
            engine.showDiagnosticMessages();
            engine.clearDiagnosticMessages();
         }
      }
   };

   //

   this.resetButton = new PushButton( this );
   this.resetButton.text = "重置";
   this.resetButton.icon = this.scaledResource( ":/icons/reload.png" );
   this.resetButton.toolTip = "<p>执行选项重置并清除所有动作。</p>";
   this.resetButton.onClick = function()
   {
      var d = new ResetDialog;
      if ( d.execute() )
      {
         if ( d.resetParametersRadioButton.checked )
            engine.setDefaultParameters();
         if ( d.reloadSettingsRadioButton.checked )
            engine.loadSettings();
         if ( d.clearFileListsCheckBox.checked )
            engine.frameGroups.length = 0;
         this.dialog.updateControls();
      }
   };

   //

   this.diagnosticsButton = new PushButton( this );
   this.diagnosticsButton.defaultButton = true;
   this.diagnosticsButton.text = "诊断";
   this.diagnosticsButton.icon = this.scaledResource( ":/icons/gear.png" );
   this.diagnosticsButton.toolTip = "<p>检查选择的文件和处理程序是否有效。</p>";
   this.diagnosticsButton.onClick = function()
   {
      engine.runDiagnostics();
      if ( engine.hasDiagnosticMessages() )
      {
         engine.showDiagnosticMessages();
         engine.clearDiagnosticMessages();
      }
      else
         (new MessageBox( "诊断完成。", TITLE + " v" + VERSION, StdIcon_Information, StdButton_Ok )).execute();
   };

   //

   this.runButton = new PushButton( this );
   this.runButton.text = "运行";
   this.runButton.icon = this.scaledResource( ":/icons/power.png" );
   this.runButton.onClick = function()
   {
      this.dialog.ok();
   };

   this.exitButton = new PushButton( this );
   this.exitButton.text = "退出";
   this.exitButton.icon = this.scaledResource( ":/icons/close.png" );
   this.exitButton.onClick = function()
   {
      this.dialog.cancel();
   };

   //

   this.cfaImagesCheckBox = new CheckBox( this );
   this.cfaImagesCheckBox.text = "彩色图像";
   this.cfaImagesCheckBox.toolTip = "<p>选中该复选框后，批量预处理脚本会将所有输入帧（校准帧和亮场帧）当做彩色图像进行处理。" +
      "启用此选项后，将使用<i>Bayer模式</i>和<i> DeBayer方法</i>在图像对齐之前执行额外的DeBayering任务。</p>";
   this.cfaImagesCheckBox.onCheck = function( checked )
   {
      engine.cfaImages = checked;
      this.dialog.updateControls();
   };

   //

   this.optimizeDarksCheckBox = new CheckBox( this );
   this.optimizeDarksCheckBox.text = "优化暗场帧";
   this.optimizeDarksCheckBox.toolTip = "<p>启用此选项可在平场和亮场校准期间应用<i>暗场优化</i>。</p>" +
      "<p>暗场优化程序会计算暗缩放比例因子，以最大程度地减少由暗减法引起的噪声。</p>";
   this.optimizeDarksCheckBox.onCheck = function( checked )
   {
      engine.optimizeDarks = checked;
      this.dialog.updateControls();
   };

   //

   this.generateRejectionMapsCheckBox = new CheckBox( this );
   this.generateRejectionMapsCheckBox.text = "生成排异图"
   this.generateRejectionMapsCheckBox.toolTip = "<p>在对偏置、暗场，平场和亮场帧进行堆叠时生成排异图图像。</p>" +
      "<p>排异图会被存储为多图像XISF文件。</p>";
   this.generateRejectionMapsCheckBox.onCheck = function( checked )
   {
      engine.generateRejectionMaps = checked;
   };

   //

   /*
   this.exportCalibrationFilesCheckBox = new CheckBox( this );
   this.exportCalibrationFilesCheckBox.text = "Export calibration files";
   this.exportCalibrationFilesCheckBox.toolTip = "<p>When checked, calibration file names will be exported in generated instances.</p>";
   this.exportCalibrationFilesCheckBox.onCheck = function( checked )
   {
      engine.exportCalibrationFiles = checked;
   };
   */

    //

    this.saveProcessLogCheckBox = new CheckBox( this );
    this.saveProcessLogCheckBox.text = "保存处理日志";
    this.saveProcessLogCheckBox.toolTip = "<p>选中后，该过程的日志将作为纯文本文件保存在输出文件夹中。</p>";
    this.saveProcessLogCheckBox.onCheck = function( checked )
    {
        engine.saveProcessLog = checked;
    };

    //

   this.upBottomFITSCheckBox = new CheckBox( this );
   this.upBottomFITSCheckBox.text = "顶-底FITS";
   this.upBottomFITSCheckBox.toolTip = "<p>如果启用此选项，则“批预处理”脚本将假定所有输入的FITS文件都遵循“左上”坐标惯例：" +
      "坐标的原点位于图像的左上角，垂直坐标从上到下递增。 这是大多数业余摄像机控制应用程序使用的约定。</p>" +
      "<p>如果禁用此选项，则采用“专业”惯例：坐标原点在左下角，垂直坐标从下到上增长。</p>";
   this.upBottomFITSCheckBox.onCheck = function( checked )
   {
      engine.upBottomFITS = checked;
   };

   //

   this.useAsMasterBiasCheckBox = new CheckBox( this );
   this.useAsMasterBiasCheckBox.text = "使用主偏置场";
   this.useAsMasterBiasCheckBox.toolTip = "<p>将第一个偏置帧文件用作主偏置。</p>";
   this.useAsMasterBiasCheckBox.onCheck = function( checked )
   {
      engine.useAsMaster[ImageType.BIAS] = checked;
      engine.updateMasterFrames( ImageType.BIAS );
      this.dialog.updateControls();
   };

   //

   this.useAsMasterDarkCheckBox = new CheckBox( this );
   this.useAsMasterDarkCheckBox.text = "使用主暗场";
   this.useAsMasterDarkCheckBox.toolTip = "<p>将第一个暗场帧文件用作主暗场。</p>";
   this.useAsMasterDarkCheckBox.onCheck = function( checked )
   {
      engine.useAsMaster[ImageType.DARK] = checked;
      engine.updateMasterFrames( ImageType.DARK );
      this.dialog.updateControls();
   };

   //

   this.useAsMasterFlatCheckBox = new CheckBox( this );
   this.useAsMasterFlatCheckBox.text = "使用主平场";
   this.useAsMasterFlatCheckBox.toolTip = "<p>将第一个平场帧文件用作主平场。</p>";
   this.useAsMasterFlatCheckBox.onCheck = function( checked )
   {
      engine.useAsMaster[ImageType.FLAT] = checked;
      engine.updateMasterFrames( ImageType.FLAT );
      this.dialog.updateControls();
   };

   //

   this.optionsSizer1 = new VerticalSizer;
   this.optionsSizer1.spacing = 4;
   this.optionsSizer1.add( this.cfaImagesCheckBox );
   this.optionsSizer1.add( this.optimizeDarksCheckBox );
   this.optionsSizer1.add( this.generateRejectionMapsCheckBox );
//   this.optionsSizer1.add( this.exportCalibrationFilesCheckBox );
   this.optionsSizer1.add( this.saveProcessLogCheckBox );

   this.optionsSizer2 = new VerticalSizer;
   this.optionsSizer2.spacing = 4;
   this.optionsSizer2.add( this.upBottomFITSCheckBox );
   this.optionsSizer2.add( this.useAsMasterBiasCheckBox );
   this.optionsSizer2.add( this.useAsMasterDarkCheckBox );
   this.optionsSizer2.add( this.useAsMasterFlatCheckBox );
   this.optionsSizer2.addStretch();

   this.optionsSizer = new HorizontalSizer;
   this.optionsSizer.margin = 6;
   this.optionsSizer.spacing = 6;
   this.optionsSizer.add( this.optionsSizer1 );
   this.optionsSizer.add( this.optionsSizer2 );

   this.optionsControl = new ParametersControl( "全局选项", this );
   this.optionsControl.add( this.optionsSizer );

   //

   this.referenceImageEdit = new Edit( this );
   this.referenceImageEdit.minWidth = this.textEditWidth;
   this.referenceImageEdit.text = engine.referenceImage;
   this.referenceImageEdit.toolTip = "<p>图像对齐的参考图像。</p>" +
      "<p>除了选择现有的磁盘文件外，您还可以双击“亮场”列表中的一个亮场帧，将其选择为对齐参考图像。</p>";
   this.referenceImageEdit.onEditCompleted = function()
   {
      engine.referenceImage = this.text = File.windowsPathToUnix( this.text.trim() );
   };

   this.referenceImageSelectButton = new ToolButton( this );
   this.referenceImageSelectButton.icon = this.scaledResource( ":/icons/select-file.png" );
   this.referenceImageSelectButton.setScaledFixedSize( 20, 20 );
   this.referenceImageSelectButton.toolTip = "<p>选择图像对齐功能的参考图像文件。</p>";
   this.referenceImageSelectButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = false;
      ofd.caption = "选择对齐参考图像";
      ofd.loadImageFilters();
      var filters = ofd.filters;
      filters.push( ["Comma Separated Value (CSV) files", ".csv", ".txt"] );
      ofd.filters = filters;
      if ( ofd.execute() )
      {
         this.dialog.referenceImageEdit.text = engine.referenceImage = ofd.fileName;
      }
   };

   this.referenceImageSizer = new HorizontalSizer;
   this.referenceImageSizer.add( this.referenceImageEdit, 100 );
   this.referenceImageSizer.addSpacing( 2 );
   this.referenceImageSizer.add( this.referenceImageSelectButton );

   this.referenceImageControl = new ParametersControl( "对齐参考图像", this );
   this.referenceImageControl.add( this.referenceImageSizer );

   //

   this.outputDirectoryEdit = new Edit( this );
   this.outputDirectoryEdit.minWidth = this.textEditWidth;
   this.outputDirectoryEdit.text = engine.outputDirectory;
   this.outputDirectoryEdit.toolTip = "<p>输出根文件夹。</p>" +
      "<p>批量预处理脚本会将产生的所有主帧、校准帧、对齐帧等图像全部存储到这个输出文件夹中。</p>";
   this.outputDirectoryEdit.onEditCompleted = function()
   {
      var dir = File.windowsPathToUnix( this.text.trim() );
      if ( dir.endsWith( '/' ) )
         dir = dir.substring( 0, dir.length-1 );
      engine.outputDirectory = this.text = dir;
   };

   this.outputDirSelectButton = new ToolButton( this );
   this.outputDirSelectButton.icon = this.scaledResource( ":/icons/select-file.png" );
   this.outputDirSelectButton.setScaledFixedSize( 20, 20 );
   this.outputDirSelectButton.toolTip = "<p>选择输出根文件夹。</p>";
   this.outputDirSelectButton.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.initialPath = engine.outputDirectory;
      gdd.caption = "选择输出文件夹";
      if ( gdd.execute() )
      {
         var dir = gdd.directory;
         if ( dir.endsWith( '/' ) )
            dir = dir.substring( 0, dir.length-1 );
         this.dialog.outputDirectoryEdit.text = engine.outputDirectory = dir;
      }
   };

   this.outputDirSizer = new HorizontalSizer;
   this.outputDirSizer.add( this.outputDirectoryEdit, 100 );
   this.outputDirSizer.addSpacing( 2 );
   this.outputDirSizer.add( this.outputDirSelectButton );

   this.outputDirControl = new ParametersControl( "输出文件夹", this );
   this.outputDirControl.add( this.outputDirSizer );

   //

   this.buttonsSizer1 = new HorizontalSizer;
   this.buttonsSizer1.spacing = 6;
   this.buttonsSizer1.add( this.newInstanceButton );
   this.buttonsSizer1.add( this.fileAddButton );
   this.buttonsSizer1.add( this.biasAddButton );
   this.buttonsSizer1.add( this.darkAddButton );
   this.buttonsSizer1.add( this.flatAddButton );
   this.buttonsSizer1.add( this.lightAddButton );
   this.buttonsSizer1.add( this.customAddButton );
   this.buttonsSizer1.addSpacing( 24 );
   this.buttonsSizer1.add( this.resetButton );
   this.buttonsSizer1.addSpacing( 24 );
   this.buttonsSizer1.addStretch();

   //

   this.buttonsSizer2 = new HorizontalSizer;
   this.buttonsSizer2.spacing = 6;
   this.buttonsSizer2.add( this.diagnosticsButton );
   this.buttonsSizer2.addStretch();
   this.buttonsSizer2.add( this.runButton );
   this.buttonsSizer2.add( this.exitButton );

   //

   this.fileListsSizer = new VerticalSizer;
   this.fileListsSizer.spacing = 8;
   this.fileListsSizer.add( this.tabBox, 100 );
   this.fileListsSizer.add( this.buttonsSizer1 );

   //

   this.settingsSizer = new VerticalSizer;
   this.settingsSizer.spacing = 8;
   this.settingsSizer.addSpacing( 24 );
   this.settingsSizer.add( this.helpLabel );
   this.settingsSizer.add( this.helpButton );
   this.settingsSizer.addStretch();
   this.settingsSizer.add( this.optionsControl );
   this.settingsSizer.add( this.referenceImageControl );
   this.settingsSizer.add( this.outputDirControl );
   this.settingsSizer.add( this.buttonsSizer2 );

   //

   this.sizer = new HorizontalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.fileListsSizer, 100 );
   this.sizer.add( this.settingsSizer );

   //

   this.windowTitle = TITLE + " v" + VERSION;
   this.adjustToContents();
   this.setMinSize( this.width, this.height + this.logicalPixelsToPhysical( 8 ) );
}

StackDialog.prototype = new Dialog;

StackDialog.prototype.clearTab = function( index )
{
   this.dialog.tabBox.pageControlByIndex( index ).treeBox.clear();
   engine.deleteFrameSet( index );
};

StackDialog.prototype.updateControls = function()
{
   this.refreshTreeBoxes();

   for ( var i = 0; i < 4; ++i )
   {
      var page = this.tabBox.pageControlByIndex( i );

      switch ( i )
      {
      case ImageType.BIAS:
         page.biasOverscanControl.updateControls();
         page.overscanControl.updateControls();
         break;
      case ImageType.DARK:
         page.darkOptimizationThresholdControl.setValue( engine.darkOptimizationLow );
         page.darkOptimizationThresholdControl.enabled = engine.optimizeDarks;
         page.darkOptimizationWindowSpinBox.value = engine.darkOptimizationWindow;
         page.darkOptimizationWindowLabel.enabled = engine.optimizeDarks;
         page.darkOptimizationWindowSpinBox.enabled = engine.optimizeDarks;
         page.darkExposureToleranceSpinBox.value = engine.darkExposureTolerance;
         break;
      case ImageType.FLAT:
         page.flatDarksOnlyCheckBox.checked = engine.flatDarksOnly;
         break;
      case ImageType.LIGHT:
         page.calibrateOnlyCheckBox.checked = engine.calibrateOnly;
         page.cosmeticCorrectionControl.updateControls();
         page.deBayeringControl.updateControls();
         page.lightsRegistrationControl.updateControls();
         page.imageRegistrationControl.updateControls();
         page.lightsIntegrationControl.updateControls();
         page.imageIntegrationControl.updateControls();
         break;
      }

      page.imageIntegrationControl.updateControls();
   }

   this.cfaImagesCheckBox.checked              = engine.cfaImages;
   this.optimizeDarksCheckBox.checked          = engine.optimizeDarks;
   this.generateRejectionMapsCheckBox.checked  = engine.generateRejectionMaps;
//   this.exportCalibrationFilesCheckBox.checked = engine.exportCalibrationFiles;
   this.saveProcessLogCheckBox.checked         = engine.saveProcessLog;
   this.upBottomFITSCheckBox.checked           = engine.upBottomFITS;
   this.useAsMasterBiasCheckBox.checked        = engine.useAsMaster[ImageType.BIAS];
   this.useAsMasterDarkCheckBox.checked        = engine.useAsMaster[ImageType.DARK];
   this.useAsMasterFlatCheckBox.checked        = engine.useAsMaster[ImageType.FLAT];
   this.referenceImageEdit.text                = engine.referenceImage;
   this.outputDirectoryEdit.text               = engine.outputDirectory;
};

StackDialog.prototype.refreshTreeBoxes = function()
{
   for ( var j = 0; j < this.tabBox.numberOfPages; ++j )
      this.tabBox.pageControlByIndex( j ).treeBox.clear();

   for ( var i = 0; i < engine.frameGroups.length; ++i )
   {
      var frameGroup = engine.frameGroups[i];

      var nodes = new Array;

      /*
       * NB: We cannot use the TreeBoxNode( TreeBox ) constructor here because
       * our treeBox object is an instance of StyledTreeBox, which we have
       * derived from TreeBox. TreeBoxNode's constructor will complain about
       * treeBox because it is not a 'real' TreeBox. This is a limitation of
       * current PJSR versions. So we construct an orphan TreeBoxNode and then
       * add it to treeBox.
       */
      //nodes.push( new TreeBoxNode( this.tabBox.pageControlByIndex( frameGroup.imageType ).treeBox ) );
      var node = new TreeBoxNode;
      this.tabBox.pageControlByIndex( frameGroup.imageType ).treeBox.add( node );
      node.expanded = true;
      node.setText( 0, "像素合并 " + frameGroup.binning.toString() );
      node.nodeData_type = "FrameGroup";
      node.nodeData_index = i;
      nodes.push( node );

      if ( frameGroup.imageType != ImageType.BIAS )
      {
         if ( frameGroup.imageType == ImageType.DARK )
         {
            if ( frameGroup.exposureTime > 0 )
            {
               var n = nodes.length;
               var node = new TreeBoxNode( nodes[n-1] );
               node.expanded = true;
               node.setText( 0, format( "%.2fs", frameGroup.exposureTime ) );
               node.nodeData_type = "FrameGroup";
               node.nodeData_index = i;
               nodes.push( node );
            }
         }
         else
         {
            if ( !frameGroup.filter.isEmpty() )
            {
               var node = new TreeBoxNode( nodes[0] );
               node.expanded = true;
               node.setText( 0, frameGroup.filter );
               node.nodeData_type = "FrameGroup";
               node.nodeData_index = i;
               nodes.push( node );
            }
         }
      }

      var rootNode = nodes[nodes.length-1];

      for ( var j = 0; j < frameGroup.fileItems.length; ++j )
      {
         var fileItem = frameGroup.fileItems[j];

         var node = new TreeBoxNode( rootNode );

         node.setText( 0, File.extractNameAndExtension( fileItem.filePath ) );

         var toolTip = "<p style=\"white-space:pre;\">" + fileItem.filePath;
         if ( fileItem.exposureTime > 0.004999 )
            toolTip += format( "<br/>曝光时间: %.2f 秒", fileItem.exposureTime );
         toolTip += "</p>";
         node.setToolTip( 0, toolTip );

         var icon = "";
         if ( j == 0 && frameGroup.masterFrame )
         {
            icon = ":/bullets/bullet-star-blue.png";
            var f = node.font( 0 );
            f.bold = true;
            node.setFont( 0, f );
         }
         else
            switch ( frameGroup.imageType )
            {
            case ImageType.BIAS:
            case ImageType.DARK:
            case ImageType.FLAT:
               icon = ":/bullets/bullet-ball-gray.png";
               break;
            case ImageType.LIGHT:
               icon = ":/bullets/bullet-ball-blue.png";
               break;
            }
         if ( !icon.isEmpty() )
            node.setIcon( 0, this.scaledResource( icon ) );

         node.nodeData_type = "FileItem";
         node.nodeData_index = j;
         node.nodeData_filePath = fileItem.filePath;
      }
   }
};

// ----------------------------------------------------------------------------
// EOF BatchPreprocessing-GUI.js - Released 2019-11-11T21:10:55Z
