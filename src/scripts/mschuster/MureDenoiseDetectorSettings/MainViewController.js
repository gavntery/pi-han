// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainViewController.js - Released 2020/01/21 00:00:00 UTC
// ****************************************************************************
//
// This file is part of MureDenoiseDetectorSettings Script Version 1.2
//
// Copyright (C) 2012-2020 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2020 Pleiades Astrophoto S.L. All Rights Reserved.
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

function MainController(model, isViewTarget) {
   this.view = null;

   this.isViewTarget = isViewTarget;

   this.setView = function(view) {
      this.view = view;
   };

   this.execute = function() {
      this.enableControls();
      if (!isViewTarget) {
         this.view.execute();
      }
   };

   this.reset = function() {
      model.flatFrame1View = null;
      this.view.flatFrame1ViewList.currentView =
         this.view.flatFrame1ViewListNull;

      model.flatFrame2View = null;
      this.view.flatFrame2ViewList.currentView =
         this.view.flatFrame2ViewListNull;

      model.biasFrame1View = null;
      this.view.biasFrame1ViewList.currentView =
         this.view.biasFrame1ViewListNull;

      model.biasFrame2View = null;
      this.view.biasFrame2ViewList.currentView =
         this.view.biasFrame2ViewListNull;

      this.resetDetectorSettings();

      this.enableControls();
   };

   this.resetDetectorSettings = function() {
      model.flatFrameExposure = model.flatFrameExposureDefault;
      this.view.flatFrameExposureValue.text = " -";

      model.detectorGain = model.detectorGainDefault;
      this.view.detectorGainValue.text = " -";

      model.detectorGaussianNoise = model.detectorGaussianNoiseDefault;
      this.view.detectorGaussianNoiseValue.text = " -";

      model.detectorOffset = model.detectorOffsetDefault;
      this.view.detectorOffsetValue.text = " -";
   };

   this.disableControls = function() {
      this.view.flatFrame1ViewList.enabled = false;

      this.view.flatFrame2ViewList.enabled = false;

      this.view.biasFrame1ViewList.enabled = false;

      this.view.biasFrame2ViewList.enabled = false;

      this.view.newInstanceButton.enabled = false;
      this.view.browseDocumentationButton.enabled = false;
      this.view.resetButton.enabled = false;

      this.view.estimateButton.enabled = false;
   };

   this.enableControls = function() {
      this.view.flatFrame1ViewList.enabled = true;

      this.view.flatFrame2ViewList.enabled = true;

      this.view.biasFrame1ViewList.enabled = true;

      this.view.biasFrame2ViewList.enabled = true;

      this.view.newInstanceButton.enabled = true;
      this.view.browseDocumentationButton.enabled = true;
      this.view.resetButton.enabled = true;

      this.view.estimateButton.enabled =
         model.flatFrame1View != null && model.flatFrame1View.isView &&
         model.flatFrame2View != null && model.flatFrame2View.isView &&
         model.biasFrame1View != null && model.biasFrame1View.isView &&
         model.biasFrame2View != null && model.biasFrame2View.isView &&

         model.flatFrame1View.image.numberOfChannels == 1 &&
         model.flatFrame2View.image.numberOfChannels == 1 &&
         model.biasFrame1View.image.numberOfChannels == 1 &&
         model.biasFrame2View.image.numberOfChannels == 1 &&

         model.frameSizeMinimum <= Math.min(
            model.flatFrame1View.image.width, model.flatFrame1View.image.height
         ) &&
         model.frameSizeMinimum <= Math.min(
            model.flatFrame2View.image.width, model.flatFrame2View.image.height
         ) &&
         model.frameSizeMinimum <= Math.min(
            model.biasFrame1View.image.width, model.biasFrame1View.image.height
         ) &&
         model.frameSizeMinimum <= Math.min(
            model.biasFrame2View.image.width, model.biasFrame2View.image.height
         ) &&

         model.flatFrame1View.image.width == model.flatFrame2View.image.width &&
         model.flatFrame1View.image.width == model.biasFrame1View.image.width &&
         model.flatFrame1View.image.width == model.biasFrame2View.image.width &&

         model.flatFrame1View.image.height ==
            model.flatFrame2View.image.height &&
         model.flatFrame1View.image.height ==
            model.biasFrame1View.image.height &&
         model.flatFrame1View.image.height ==
            model.biasFrame2View.image.height &&

         model.flatFrame1View.fullId != model.flatFrame2View.fullId &&
         model.flatFrame1View.fullId != model.biasFrame1View.fullId &&
         model.flatFrame1View.fullId != model.biasFrame2View.fullId &&
         model.flatFrame2View.fullId != model.biasFrame1View.fullId &&
         model.flatFrame2View.fullId != model.biasFrame2View.fullId &&
         model.biasFrame1View.fullId != model.biasFrame2View.fullId &&

         Math.min(
            model.flatFrame1Median, model.flatFrame2Median
         ) > Math.max(
            model.biasFrame1Median, model.biasFrame2Median
         );
   };

   this.checkFrameView = function(view) {
      if (!(
         view.image.numberOfChannels == 1
      )) {
         (new MessageBox(
            "<p><b>Error</b>: A monochannel frame must be selected.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      if (!(
         model.frameSizeMinimum <= Math.min(
            view.image.width, view.image.height
         )
      )) {
         (new MessageBox(
            "<p><b>Error</b>: The size of the selected frame must be at " +
            "least " + format("%d ", model.frameSizeMinimum) +
            "pixels in width and height.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      if (!(
         (model.flatFrame1View == null || !model.flatFrame1View.isView ||
         view.image.width == model.flatFrame1View.image.width) &&
         (model.flatFrame2View == null || !model.flatFrame2View.isView ||
         view.image.width == model.flatFrame2View.image.width) &&
         (model.biasFrame1View == null || !model.biasFrame1View.isView ||
         view.image.width == model.biasFrame1View.image.width) &&
         (model.biasFrame2View == null || !model.biasFrame2View.isView ||
         view.image.width == model.biasFrame2View.image.width) &&

         (model.flatFrame1View == null || !model.flatFrame1View.isView ||
         view.image.height == model.flatFrame1View.image.height) &&
         (model.flatFrame2View == null || !model.flatFrame2View.isView ||
         view.image.height == model.flatFrame2View.image.height) &&
         (model.biasFrame1View == null || !model.biasFrame1View.isView ||
         view.image.height == model.biasFrame1View.image.height) &&
         (model.biasFrame2View == null || !model.biasFrame2View.isView ||
         view.image.height == model.biasFrame2View.image.height)
      )) {
         (new MessageBox(
            "<p><b>Error</b>: Frame widths and heights must be equal.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      if (!(
         (model.flatFrame1View == null || !model.flatFrame1View.isView ||
         view.fullId != model.flatFrame1View.fullId) &&
         (model.flatFrame2View == null || !model.flatFrame2View.isView ||
         view.fullId != model.flatFrame2View.fullId) &&
         (model.biasFrame1View == null || !model.biasFrame1View.isView ||
         view.fullId != model.biasFrame1View.fullId) &&
         (model.biasFrame2View == null || !model.biasFrame2View.isView ||
         view.fullId != model.biasFrame2View.fullId)
      )) {
         (new MessageBox(
            "<p><b>Error</b>: Duplicate frames may not be selected.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      return true;
   };

   this.checkFlatFrameView = function() {
      if (!(
         model.flatFrame1View == null || !model.flatFrame1View.isView ||
         model.flatFrame2View == null || !model.flatFrame2View.isView ||
         model.biasFrame1View == null || !model.biasFrame1View.isView ||
         model.biasFrame2View == null || !model.biasFrame2View.isView ||
         Math.min(
            model.flatFrame1Median, model.flatFrame2Median
         ) > Math.max(
            model.biasFrame1Median, model.biasFrame2Median
         )
      )) {
         (new MessageBox(
            "<p><b>Error</b>: Uncalibrated flat frame median must be larger " +
            "than bias or dark frame median.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      if (!(
         model.flatFrame1View == null || !model.flatFrame1View.isView ||
         model.flatFrame2View == null || !model.flatFrame2View.isView ||
         model.flatFrame1Median != 0 &&
         model.flatFrame2Median != 0 &&
         Math.min(
            model.flatFrame1Median,
            model.flatFrame2Median
         ) / Math.max(
            model.flatFrame1Median,
            model.flatFrame2Median
         ) > model.flatFrameRatioMinimum
      )) {
         (new MessageBox(
            "<p><b>Warning</b>: Uncalibrated flat frame medians should be " +
            "equal within " +
            format("%.0f", 100 * (1 - model.flatFrameRatioMinimum)) + "%.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      return true;
   };

   this.checkBiasFrameView = function() {
      if (!(
         model.flatFrame1View == null || !model.flatFrame1View.isView ||
         model.flatFrame2View == null || !model.flatFrame2View.isView ||
         model.biasFrame1View == null || !model.biasFrame1View.isView ||
         model.biasFrame2View == null || !model.biasFrame2View.isView ||
         Math.min(
            model.flatFrame1Median, model.flatFrame2Median
         ) > Math.max(
            model.biasFrame1Median, model.biasFrame2Median
         )
      )) {
         (new MessageBox(
            "<p><b>Error</b>: Uncalibrated flat frame median must be larger " +
            "than bias or dark frame median.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      if (!(
         model.biasFrame1View == null || !model.biasFrame1View.isView ||
         model.biasFrame2View == null || !model.biasFrame2View.isView ||
         model.biasFrame1Median != 0 &&
         model.biasFrame2Median != 0 &&
         Math.min(
            model.biasFrame1Median,
            model.biasFrame2Median
         ) / Math.max(
            model.biasFrame1Median,
            model.biasFrame2Median
         ) > model.biasFrameRatioMinimum
      )) {
         (new MessageBox(
            "<p><b>Warning</b>: Bias or dark frame medians should be " +
            "equal within " +
            format("%.0f", 100 * (1 - model.biasFrameRatioMinimum)) + "%.</p>",
            TITLE, StdIcon_Error, StdButton_Ok
         )).execute();
         return false;
      }

      return true;
   };

   this.flatFrame1ViewOnViewSelected = function(view) {
      if (!view.isView) {
         view = null;
      }
      model.flatFrame1View = null;
      var ok = view != null && view.isView && this.checkFrameView(view);
      model.flatFrame1View = view;
      model.flatFrame1Median =
         view != null && view.isView ? view.image.median() : 0;
      if (ok) {
         this.checkFlatFrameView();
      }

      this.resetDetectorSettings();
      this.enableControls();
   };

   this.flatFrame2ViewOnViewSelected = function(view) {
      if (!view.isView) {
         view = null;
      }
      model.flatFrame2View = null;
      var ok = view != null && view.isView && this.checkFrameView(view);
      model.flatFrame2View = view;
      model.flatFrame2Median =
         view != null && view.isView ? view.image.median() : 0;
      if (ok) {
         this.checkFlatFrameView();
      }

      this.resetDetectorSettings();
      this.enableControls();
   };

   this.biasFrame1ViewOnViewSelected = function(view) {
      if (!view.isView) {
         view = null;
      }
      model.biasFrame1View = null;
      var ok = view != null && view.isView && this.checkFrameView(view);
      model.biasFrame1View = view;
      model.biasFrame1Median =
         view != null && view.isView ? view.image.median() : 0;
      if (ok) {
         this.checkBiasFrameView();
      }

      this.resetDetectorSettings();
      this.enableControls();
   };

   this.biasFrame2ViewOnViewSelected = function(view) {
      if (!view.isView) {
         view = null;
      }
      model.biasFrame2View = null;
      var ok = view != null && view.isView && this.checkFrameView(view);
      model.biasFrame2View = view;
      model.biasFrame2Median =
         view != null && view.isView ? view.image.median() : 0;
      if (ok) {
         this.checkBiasFrameView();
      }

      this.resetDetectorSettings();
      this.enableControls();
   };

   this.logCalibrationFrames = function() {
      console.writeln();
      console.writeln("<b>Calibration frames:</b>");

      console.writeln(format(
         "Uncalibrated flat frame 1: " + model.frameViewFormat,
         model.flatFrame1View.fullId
      ));
      console.writeln(format(
         "Uncalibrated flat frame 2: " + model.frameViewFormat,
         model.flatFrame2View.fullId
      ));
      console.writeln(format(
         "Bias or dark frame 1: " + model.frameViewFormat,
         model.biasFrame1View.fullId
      ));
      console.writeln(format(
         "Bias or dark frame 2: " + model.frameViewFormat,
         model.biasFrame2View.fullId
      ));

      console.flush();
   };

   this.logDetectorSettings = function() {
      console.writeln();
      console.writeln(format(
         "Flat frame exposure: " + model.flatFrameExposureFormat + " " +
         model.flatFrameExposureUnits,
         model.flatFrameExposure
      ));

      console.writeln();
      console.writeln("<b>Detector settings:</b>");

      console.writeln(format(
         "Gain: " + model.detectorGainFormat + " " + model.detectorGainUnits,
         model.detectorGain
      ));
      console.writeln(format(
         "Gaussian noise: " + model.detectorGaussianNoiseFormat + " " +
         model.detectorGaussianNoiseUnits,
         model.detectorGaussianNoise
      ));
      console.writeln(format(
         "Offset: " + model.detectorOffsetFormat + " " +
         model.detectorOffsetUnits,
         model.detectorOffset
      ));
   };

   this.estimateDetectorGain = function() {
      var flat1 = model.flatFrame1View.image.toMatrix();
      var flat2 = model.flatFrame2View.image.toMatrix();
      var bias1 = model.biasFrame1View.image.toMatrix();
      var bias2 = model.biasFrame2View.image.toMatrix();
      var flatBias1 = flat1.sub(bias1);
      var flatBias2 = flat2.sub(bias2);
      var sum = flatBias1.add(flatBias2);
      var difference = flat1.sub(flat2);

      var cropRows = Math.floor(model.cropFactor * difference.rows);
      var cropCols = Math.floor(model.cropFactor * difference.cols);

      var blockSize = 8;
      var stepSize = 8;
      var meansArray = new Array();
      var stdDevsArray = new Array();
      var block = new Vector();
      for (
         var y = cropRows;
         y <= difference.rows - cropRows - blockSize;
         y += stepSize
      ) {
         for (
            var x = cropCols;
            x <= difference.cols - cropCols - blockSize;
            x += stepSize
         ) {
            var blockArray = sum.toArray(y, x, blockSize, blockSize);
            block.assign(blockArray, 0, blockSize * blockSize);
            meansArray.push(block.mean());
            var blockArray = difference.toArray(y, x, blockSize, blockSize);
            block.assign(blockArray, 0, blockSize * blockSize);
            stdDevsArray.push(block.stdDev());
         }
         if ((y % 128) == 0) {
            this.view.throwAbort();
         }
      }

      var means = new Vector(meansArray);
      var mean = 0.5 * means.median();
      var stdDevs = new Vector(stdDevsArray);
      var normalization = 1.0 / 0.996034;
      var stdDev = normalization * Math.sqrt(0.5) * stdDevs.median();

      try {
         assert(stdDev != 0,
            "The median local standard deviation of the bias- or " +
            "dark-subtracted flat frame difference equals zero. The two " +
            "bias- or dark-subracted flat frames appear to be statistically " +
            "identical."
         );
         model.detectorGain =
            stdDev == 0 ? 0 : mean / (stdDev * stdDev) / 65535;
         model.flatFrameExposure =
            stdDev == 0 ? 0 : (mean * mean) / (stdDev * stdDev);
      } finally {
         stdDevs.assign(0, 0);
         means.assign(0, 0);
         block.assign(0, 0);
         difference.assign(0, 0, 0);
         sum.assign(0, 0, 0);
         flatBias1.assign(0, 0, 0);
         flatBias2.assign(0, 0, 0);
         bias1.assign(0, 0, 0);
         bias2.assign(0, 0, 0);
         flat1.assign(0, 0, 0);
         flat2.assign(0, 0, 0);
      }
   };

   this.estimateDetectorGaussianNoise = function() {
      var bias1 = model.biasFrame1View.image.toMatrix();
      var bias2 = model.biasFrame2View.image.toMatrix();
      var difference = bias1.sub(bias2);

      var blockSize = 8;
      var stepSize = 8;
      var stdDevsArray = new Array();
      var block = new Vector();
      for (var y = 0; y <= difference.rows - blockSize; y += stepSize) {
         for (var x = 0; x <= difference.cols - blockSize; x += stepSize) {
            var blockArray = difference.toArray(y, x, blockSize, blockSize);
            block.assign(blockArray, 0, blockSize * blockSize);
            stdDevsArray.push(block.stdDev());
         }
         if ((y % 128) == 0) {
            this.view.throwAbort();
         }
      }

      var stdDevs = new Vector(stdDevsArray);
      var normalization = 1.0 / 0.996034;
      var stdDev = normalization * Math.sqrt(0.5) * stdDevs.median();

      try {
         assert(stdDev != 0,
            "The median local standard deviation of the bias or dark frame " +
            "difference equals zero. The two bias or two dark frames appear " +
            "to be statistically identical."
         );
         model.detectorGaussianNoise = 65535 * stdDev;
      } finally {
         stdDevs.assign(0, 0);
         block.assign(0, 0);
         difference.assign(0, 0, 0);
         bias1.assign(0, 0, 0);
         bias2.assign(0, 0, 0);
      }
   };

   this.estimateDetectorOffset = function() {
      model.detectorOffset = 0;
   };

   this.estimate = function() {
      this.resetDetectorSettings();
      this.disableControls();
      this.view.enableAbort();
      console.show();
      console.flush();

      console.beginLog();
      console.writeln();
      console.writeln("<b>" + TITLE + " Version " + VERSION + "</b>");
      console.flush();

      try {
         this.logCalibrationFrames();

         var time = -(new Date()).getTime();

         this.estimateDetectorGain();
         this.view.throwAbort();
         this.estimateDetectorGaussianNoise();
         this.view.throwAbort();
         this.estimateDetectorOffset();
         this.view.throwAbort();

         this.view.flatFrameExposureValue.text = format(
            " " + model.flatFrameExposureFormat, model.flatFrameExposure
         );

         this.view.detectorGainValue.text = format(
            " " + model.detectorGainFormat, model.detectorGain
         );
         this.view.detectorGaussianNoiseValue.text = format(
            " " + model.detectorGaussianNoiseFormat, model.detectorGaussianNoise
         );
         this.view.detectorOffsetValue.text = format(
            " " + model.detectorOffsetFormat, model.detectorOffset
         );

         time += (new Date()).getTime();

         this.logDetectorSettings();

         console.writeln();
         console.writeln(format("%.03f s", 0.001 * time));
         console.flush();
      }
      catch (exception) {
         this.resetDetectorSettings();
         console.criticalln();
         console.criticalln(
            !(new RegExp("^abort")).test(exception.message) ?
            "<b>Error</b>: " + exception.message :
            exception.message
         );
         console.flush();
         if (!isViewTarget) {
            if (!(new RegExp("^abort")).test(exception.message)) {
               (new MessageBox(
                  "<p><b>Error</b>: " + exception.message + "</p>" +
                  "<p>Estimation aborted.</p>",
                  TITLE,
                  StdIcon_Error,
                  StdButton_Ok
               )).execute();
            }
         }
      }

      console.flush();
      console.hide();
      gc();
      this.view.disableAbort();
      this.enableControls();
   };

   this.dismiss = function() {
      this.view.ok();
   };

   this.newInstance = function() {
      model.storeParameters();
   };

   this.browseDocumentation = function() {
      if (!Dialog.browseScriptDocumentation(TITLE)) {
         (new MessageBox(
            "<p>Documentation has not been installed.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
      }
   };
}

function MainView(model, controller) {
   this.__base__ = Dialog;
   this.__base__();

   this.consoleAbortEnabled = function() {
      return controller.isViewTarget;
   };

   Console.abortEnabled = this.consoleAbortEnabled();
   this.abortEnabled = false;
   this.abortRequested = false;

   this.enableAbort = function() {
      this.abortEnabled = true;
      this.abortRequested = false;
      this.dismissAbortButton.text =
         "Abort";
      this.dismissAbortButton.toolTip =
         "<p>Abort the denoising.</p>";
   };

   this.disableAbort = function () {
      this.abortEnabled = false;
      this.abortRequested = false;
      this.dismissAbortButton.text =
         "Dismiss";
      this.dismissAbortButton.toolTip =
         "<p>Dismiss the dialog.</p>";
   };

   this.throwAbort = function() {
      processEvents();
      if (
         this.abortEnabled && (this.abortRequested || Console.abortRequested)
      ) {
         throw new Error("abort");
      }
   };

   this.addGroupBox = function(title) {
      var groupBox = new GroupBox(this);
      this.sizer.add(groupBox);

      groupBox.sizer = new VerticalSizer;
      groupBox.sizer.margin = 6;
      groupBox.sizer.spacing = 6;
      groupBox.title = title;
      groupBox.styleSheet = "*{}";

#ifeq __PI_PLATFORM__ MACOSX
      if (coreVersionBuild < 1168) {
         groupBox.sizer.addSpacing(-6);
      }
#endif

      return groupBox;
   };

   this.addPane = function(group) {
      var buttonPane = new HorizontalSizer;
      buttonPane.spacing = 6;
      group.sizer.add(buttonPane);

      return buttonPane;
   };

   this.addViewList = function(pane, view, onViewSelected) {
      var viewList = new ViewList(this);
      pane.add(viewList);

      viewList.getMainViews();
      if (view != null && view.isView) {
         viewList.currentView = view;
      }
      viewList.onViewSelected = onViewSelected;

      return viewList;
   }

   this.addLabel = function(pane, text, toolTip) {
      var label = new Label(this);
      pane.add(label);

      label.setFixedWidth(this.labelWidth);
      label.text = text;
      label.toolTip = toolTip;
      label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      return label;
   };

   this.addUnits = function(pane, text) {
      var label = new Label(this);
      pane.add(label);

      label.setFixedWidth(this.unitWidth);
      label.text = text;
      label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

      return label;
   };

   this.addValue = function(pane, text, toolTip) {
      var value = new Label(this);
      pane.add(value);

      value.setFixedWidth(this.editWidth);
      value.text = text;
      value.toolTip = toolTip;
      value.styleSheet = this.scaledStyleSheet("QLabel {" +
         "border-top: 1px solid gray;" +
         "border-left: 1px solid gray;" +
         "border-bottom: 1px solid white;" +
         "border-right: 1px solid white;" +
         "}");

      return value;
   };

   this.addPushButton = function(pane, text, toolTip, onClick) {
      var pushButton = new PushButton(this);
      pane.add(pushButton);

      pushButton.text = text;
      pushButton.toolTip = toolTip;
      pushButton.onClick = onClick;

      return pushButton;
   };

   this.addToolButtonMousePress = function(pane, icon, toolTip, onMousePress) {
      var toolButton = new ToolButton(this);
      pane.add(toolButton);

      toolButton.icon = this.scaledResource(icon);
      toolButton.setScaledFixedSize(20, 20);
      toolButton.toolTip = toolTip;
      toolButton.onMousePress = onMousePress;

      return toolButton;
   };

   this.addToolButton = function(pane, icon, toolTip, onClick) {
      var toolButton = new ToolButton(this);
      pane.add(toolButton);

      toolButton.icon = this.scaledResource(icon);
      toolButton.setScaledFixedSize(20, 20);
      toolButton.toolTip = toolTip;
      toolButton.onClick = onClick;

      return toolButton;
   };

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   this.labelWidth = this.font.width("Uncalibrated flat frame 2:")
   this.editWidth = this.font.width("0000000000");
   this.unitWidth = this.font.width(model.detectorGainUnits);

   {
      this.calibrationFrameGroupBox = this.addGroupBox("Calibration frames");

      {
         this.flatFrame1ViewPane = this.addPane(this.calibrationFrameGroupBox);

         this.flatFrame1ViewLabel = this.addLabel(
            this.flatFrame1ViewPane,
            "Uncalibrated flat frame 1:",
            "<p>Uncalibrated flat frame 1.</p>" +

            "<p>The medians of the two uncalibrated flat frames should be " +
            "equal within " +
            format("%.0f", 100 * (1 - model.flatFrameRatioMinimum)) + "%.</p>"
         );

         this.flatFrame1ViewList = this.addViewList(
            this.flatFrame1ViewPane,
            null,
            function(view) {
               controller.flatFrame1ViewOnViewSelected(view);
            }
         );
         this.flatFrame1ViewListNull = this.flatFrame1ViewList.currentView;
      }

      {
         this.flatFrame2ViewPane = this.addPane(this.calibrationFrameGroupBox);

         this.flatFrame2ViewLabel = this.addLabel(
            this.flatFrame2ViewPane,
            "Uncalibrated flat frame 2:",
            "<p>Uncalibrated flat frame 2.</p>" +

            "<p>The medians of the two uncalibrated flat frames should be " +
            "equal within " +
            format("%.0f", 100 * (1 - model.flatFrameRatioMinimum)) + "%.</p>"
         );

         this.flatFrame2ViewList = this.addViewList(
            this.flatFrame2ViewPane,
            null,
            function(view) {
               controller.flatFrame2ViewOnViewSelected(view);
            }
         );
         this.flatFrame2ViewListNull = this.flatFrame2ViewList.currentView;
      }

      {
         this.biasFrame1ViewPane = this.addPane(this.calibrationFrameGroupBox);

         this.biasFrame1ViewLabel = this.addLabel(
            this.biasFrame1ViewPane,
            "Bias or dark frame 1:",
            "<p>Bias or dark frame 1.</p>" +

            "<p>The medians of the two bias or two dark frames should be " +
            "equal within " +
            format("%.0f", 100 * (1 - model.biasFrameRatioMinimum)) + "%.</p>"
         );

         this.biasFrame1ViewList = this.addViewList(
            this.biasFrame1ViewPane,
            null,
            function(view) {
               controller.biasFrame1ViewOnViewSelected(view);
            }
         );
         this.biasFrame1ViewListNull = this.biasFrame1ViewList.currentView;
      }

      {
         this.biasFrame2ViewPane = this.addPane(this.calibrationFrameGroupBox);

         this.biasFrame2ViewLabel = this.addLabel(
            this.biasFrame2ViewPane,
            "Bias or dark frame 2:",
            "<p>Bias or dark frame 2.</p>" +

            "<p>The medians of the two bias or two dark frames should be " +
            "equal within " +
            format("%.0f", 100 * (1 - model.biasFrameRatioMinimum)) + "%.</p>"
         );

         this.biasFrame2ViewList = this.addViewList(
            this.biasFrame2ViewPane,
            null,
            function(view) {
               controller.biasFrame2ViewOnViewSelected(view);
            }
         );
         this.biasFrame2ViewListNull = this.biasFrame2ViewList.currentView;
      }

      {
         this.flatFrameExposurePane =
            this.addPane(this.calibrationFrameGroupBox);

         this.flatFrameExposureLabel = this.addLabel(
            this.flatFrameExposurePane,
            "Flat frame exposure:",
            "<p>A measure of the median flat frame exposure, in the form of " +
            "the median of the pixel-wise mean of the center cropped " +
            "bias- or dark-subtracted flat frames.</p>" +

            "<p>To provide sufficient signal-to-noise ratio and to avoid " +
            "near saturation nonlinearity, flat frame exposure should be " +
            "between roughly 30% and 70% of detector full-well.</p>"
         );

         this.flatFrameExposureValue = this.addValue(
            this.flatFrameExposurePane,
            " -",
            this.flatFrameExposureLabel.toolTip
         );

         this.flatFrameExposureUnits = this.addUnits(
            this.flatFrameExposurePane,
            model.flatFrameExposureUnits
         );

         this.flatFrameExposurePane.addStretch();
      }
   }

   {
      this.detectorGroupBox = this.addGroupBox("Detector settings");

      {
         this.detectorGainPane = this.addPane(this.detectorGroupBox);

         this.detectorGainLabel = this.addLabel(
            this.detectorGainPane,
            "Gain:",
            "<p>Estimated detector gain.</p>"
         );

         this.detectorGainValue = this.addValue(
            this.detectorGainPane,
            " -",
            this.detectorGainLabel.toolTip
         );

         this.detectorGainUnits = this.addUnits(
            this.detectorGainPane,
            model.detectorGainUnits
         );

         this.detectorGainPane.addStretch();
      }

      {
         this.detectorGaussianNoisePane = this.addPane(this.detectorGroupBox);

         this.detectorGaussianNoiseLabel = this.addLabel(
            this.detectorGaussianNoisePane,
            "Gaussian noise:",
            "<p>Estimated detector Gaussian noise.</p>"
         );

         this.detectorGaussianNoiseValue = this.addValue(
            this.detectorGaussianNoisePane,
            " -",
            this.detectorGaussianNoiseLabel.toolTip
         );

         this.detectorGaussianNoiseUnits = this.addUnits(
            this.detectorGaussianNoisePane,
            model.detectorGaussianNoiseUnits
         );

         this.detectorGaussianNoisePane.addStretch();
      }

      {
         this.detectorOffsetPane = this.addPane(this.detectorGroupBox);

         this.detectorOffsetLabel = this.addLabel(
            this.detectorOffsetPane,
            "Offset:",
            "<p>Estimated detector offset.</p>" +

            "<p>Detector offset should be set to zero for denoising " +
            "calibrated images with no pedestal.</p>"
         );

         this.detectorOffsetValue = this.addValue(
            this.detectorOffsetPane,
            " -",
            this.detectorOffsetLabel.toolTip
         );

         this.detectorOffsetUnits = this.addUnits(
            this.detectorOffsetPane,
            model.detectorOffsetUnits
         );

         this.detectorOffsetPane.addStretch();
      }
   }

   this.sizer.addStretch();

   {
      this.buttonPane = this.addPane(this);

      this.newInstanceButton = this.addToolButtonMousePress(
         this.buttonPane,
         ":/process-interface/new-instance.png",
         "<p>Create a new instance.</p>",
         function() {
            this.hasFocus = true;
            controller.newInstance();
            this.pushed = false;
            this.dialog.newInstance();
         }
      );

      this.browseDocumentationButton = this.addToolButton(
         this.buttonPane,
         ":/process-interface/browse-documentation.png",
         "<p>Open a browser to view documentation.</p>",
         function() {
            controller.browseDocumentation();
         }
      );

      this.resetButton = this.addToolButton(
         this.buttonPane,
         ":/images/icons/reset.png",
         "<p>Reset all parameters.</p>",
         function() {
            controller.reset();
         }
      );

      this.versionLabel = this.addLabel(
         this.buttonPane,
         "Version " + VERSION,
         "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +

         "<p>Estimates detector settings for use by the MureDenoise " +
         "script.</p>" +

         "<p>The script requires as input two uncalibrated flat frames and " +
         "two bias or two dark frames. The use of two dark frames rather " +
         "than two bias frames allows the script to account for dark current " +
         "noise.</p>" +

         "<p>Copyright &copy; 2012-2020 Mike Schuster. All Rights " +
         "Reserved.<br>" +
         "Copyright &copy; 2003-2020 Pleiades Astrophoto S.L. All Rights " +
         "Reserved.</p>"
      );
      this.versionLabel.setVariableWidth();

      this.buttonPane.addStretch();

      this.estimateButton = this.addPushButton(
         this.buttonPane,
         "Estimate",
         "<p>Estimate detector settings.</p>",
         function() {
            controller.estimate();
         }
      );

      this.dismissAbortButton = this.addPushButton(
         this.buttonPane,
         "Dismiss",
         "<p>Dismiss the dialog or abort the estimation.</p>",
         function() {
            if (this.dialog.abortEnabled) {
               this.dialog.abortRequested = true;
            }
            else {
               controller.dismiss();
            }
         }
      );
      this.dismissAbortButton.defaultButton = true;
      this.dismissAbortButton.hasFocus = true;
   }

   this.onClose = function() {
      if (this.dialog.abortEnabled) {
         this.dialog.abortRequested = true;
      }
   }

   this.windowTitle = TITLE;

   this.adjustToContents();
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(80));
   this.setFixedHeight(this.height + this.logicalPixelsToPhysical(20));

   this.disableAbort();
}
MainView.prototype = new Dialog;

// ****************************************************************************
// EOF MainViewController.js - Released 2020/01/21 00:00:00 UTC
