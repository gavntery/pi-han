// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainViewController.js - Released 2020/01/21 00:00:00 UTC
// ****************************************************************************
//
// This file is part of MureDenoise Script Version 1.27
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

   this.setImageView = function(view) {
      if (view != null && view.isView) {
         model.imageView = view;
         this.useImageMetadata();
         this.useImageMetadataUpdateText();
         this.view.imageViewList.currentView = model.imageView;
         if (!this.checkImageView(!isViewTarget) && !isViewTarget) {
            model.imageView = null;
            this.view.imageViewList.currentView = this.view.imageViewListNull;
            this.useImageMetadata();
            this.useImageMetadataUpdateText();
         }
      }
      else {
         model.imageView = null;
         this.view.imageViewList.currentView = this.view.imageViewListNull;
         this.useImageMetadata();
         this.useImageMetadataUpdateText();
      }

      if (
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !this.checkFlatfieldView(!isViewTarget) &&
         !isViewTarget
      ) {
         model.flatfieldView = null;
         this.view.flatfieldViewList.currentView =
            this.view.flatfieldViewListNull;
      }

      this.enableControls();
   };

   this.checkImageView = function(silent = false) {
      var message = null;
      if (
         model.imageView != null &&
         model.imageView.isView &&
         !(model.imageView.image.numberOfChannels == 1)
      ) {
         message = "<b>Error</b>: A monochannel image must be " +
            "selected for denoising.";
      }
      else if (
         model.imageView != null &&
         model.imageView.isView &&
         !(model.imageSizeMinimum <= Math.min(
            model.imageView.image.width, model.imageView.image.height
         ))
      ) {
         message = "<b>Error</b>: The size of the selected image must " +
            "be at least " +
            format("%d ", model.imageSizeMinimum) +
            "pixels in width and height.";
      }
      else if (
         model.imageView != null &&
         model.imageView.isView &&
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(
            model.imageView.window.mainView.image.width ==
               model.flatfieldView.image.width &&
            model.imageView.window.mainView.image.height ==
               model.flatfieldView.image.height
         )
      ) {
         message = "<b>Error</b>: The sizes of the main view of the image " +
            "selected for denoising and the main view of the flatfield must " +
            "be equal.";
      }
      if (message != null && !silent) {
         if (isViewTarget) {
            console.criticalln();
            console.criticalln(message);
            console.flush();
         }
         else {
            (new MessageBox(
               "<p>" + message + "</p>", TITLE, StdIcon_Error, StdButton_Ok
            )).execute();
         }
      }

      return message == null;
   };

   this.checkFlatfieldView = function(silent = false) {
      var message = null;
      if (
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(model.flatfieldView.image.numberOfChannels == 1)
      ) {
         message = "<b>Error</b>: A monochannel image must be " +
            "selected for a flatfield.";
      }
      else if (
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(model.flatfieldSizeMinimum <= Math.min(
            model.flatfieldView.image.width, model.flatfieldView.image.height
         ))
      ) {
         message = "<b>Error</b>: The size of the flatfield image must " +
            "be at least " +
            format("%d ", model.flatfieldSizeMinimum) +
            "pixels in width and height.";
      }
      else if (
         model.imageView != null &&
         model.imageView.isView &&
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(
            model.imageView.window.mainView.image.width ==
               model.flatfieldView.image.width &&
            model.imageView.window.mainView.image.height ==
               model.flatfieldView.image.height
         )
      ) {
         message = "<b>Error</b>: The sizes of the main view of the image " +
            "selected for denoising and the main view of the flatfield must " +
            "be equal.";
      }
      if (message != null && !silent) {
         if (isViewTarget) {
            console.criticalln();
            console.criticalln(message);
            console.flush();
         }
         else {
            (new MessageBox(
               "<p>" + message + "</p>", TITLE, StdIcon_Error, StdButton_Ok
            )).execute();
         }
      }

      return message == null;
   };

   this.execute = function() {
      this.enableControls();
      if (isViewTarget) {
         if (this.view.denoiseButton.enabled) {
            this.denoise();
         }
         else {
            console.criticalln();
            console.criticalln(format(
               "<b>Error</b>: Cannot denoise: view: " + model.imageViewFormat,
               model.imageView.fullId
            ));
            console.flush();
         }
      }
      else {
         this.view.execute();
      }
   };

   this.reset = function() {
      model.imageView = null;
      this.view.imageViewList.currentView = this.view.imageViewListNull;
      this.useImageMetadata();
      this.useImageMetadataUpdateText();

      model.imageCombinationCount = model.imageCombinationCountDefault;
      this.view.imageCombinationCountEdit.text = format(
         model.imageCombinationCountFormat,
         model.imageCombinationCount
      );
      model.imageInterpolationMethod = model.imageInterpolationMethodDefault;
      this.view.imageInterpolationMethodComboBox.currentItem =
         model.imageInterpolationMethod;

      model.flatfieldView = null;
      this.view.flatfieldViewList.currentView = this.view.flatfieldViewListNull;

      model.detectorGain = model.detectorGainDefault;
      this.view.detectorGainEdit.text = format(
         model.detectorGainFormat,
         model.detectorGain
      );
      model.detectorGaussianNoise = model.detectorGaussianNoiseDefault;
      this.view.detectorGaussianNoiseEdit.text = format(
         model.detectorGaussianNoiseFormat,
         model.detectorGaussianNoise
      );
      model.detectorOffset = model.detectorOffsetDefault;
      this.view.detectorOffsetEdit.text = format(
         model.detectorOffsetFormat,
         model.detectorOffset
      );

      model.denoiseVarianceScale = model.denoiseVarianceScaleDefault;
      this.view.denoiseVarianceScaleEdit.text = format(
         model.denoiseVarianceScaleFormat,
         model.denoiseVarianceScale
      );
      model.denoiseCycleSpinCount = model.denoiseCycleSpinCountDefault;
      this.view.denoiseCycleSpinCountEdit.text = format(
         model.denoiseCycleSpinCountFormat,
         model.denoiseCycleSpinCount
      );
      model.useImageMetadata = model.useImageMetadataDefault;
      this.view.useImageMetadataCheckBox.checked =
         model.useImageMetadata;
      this.useImageMetadata();
      this.useImageMetadataUpdateText();
      model.includeGradientClassifier = model.includeGradientClassifierDefault;
      this.view.includeGradientClassifierCheckBox.checked =
         model.includeGradientClassifier;
      model.generateMethodNoiseImage = model.generateMethodNoiseImageDefault;
      this.view.generateMethodNoiseImageCheckBox.checked =
         model.generateMethodNoiseImage;

      this.enableControls();
   };

   this.disableControls = function() {
      this.view.imageViewList.enabled = false;

      this.view.imageCombinationCountEdit.enabled = false;
      this.view.imageInterpolationMethodComboBox.enabled = false;

      this.view.flatfieldViewList.enabled = false;

      this.view.detectorGainEdit.enabled = false;
      this.view.detectorGaussianNoiseEdit.enabled = false;
      this.view.detectorOffsetEdit.enabled = false;

      this.view.denoiseVarianceScaleEdit.enabled = false;
      this.view.denoiseCycleSpinCountEdit.enabled = false;
      this.view.useImageMetadataCheckBox.enabled = false;
      this.view.includeGradientClassifierCheckBox.enabled = false;
      this.view.generateMethodNoiseImageCheckBox.enabled = false;

      this.view.newInstanceButton.enabled = false;
      this.view.browseDocumentationButton.enabled = false;
      this.view.resetButton.enabled = false;

      this.view.denoiseButton.enabled = false;
   };

   this.enableControls = function() {
      this.view.imageViewList.enabled = true;

      this.view.imageCombinationCountEdit.enabled = true;
      this.view.imageInterpolationMethodComboBox.enabled =
         model.imageCombinationCount != 1;

      this.view.flatfieldViewList.enabled = true;

      this.view.detectorGainEdit.enabled = true;
      this.view.detectorGaussianNoiseEdit.enabled = true;
      this.view.detectorOffsetEdit.enabled = true;

      this.view.denoiseVarianceScaleEdit.enabled = true;
      this.view.denoiseCycleSpinCountEdit.enabled = true;
      this.view.useImageMetadataCheckBox.enabled = true;
      this.view.includeGradientClassifierCheckBox.enabled = true;
      this.view.generateMethodNoiseImageCheckBox.enabled = true;

      this.view.newInstanceButton.enabled = true;
      this.view.browseDocumentationButton.enabled = true;
      this.view.resetButton.enabled = true;

      this.view.denoiseButton.enabled =
         model.detectorGain != 0 &&
         model.detectorGaussianNoise != 0 &&
         model.imageView != null &&
         model.imageView.isView &&
         model.imageView.image.numberOfChannels == 1 &&
         model.imageSizeMinimum <= Math.min(
            model.imageView.image.width, model.imageView.image.height
         ) && (
            model.flatfieldView == null ||
            !model.flatfieldView.isView || (
               model.flatfieldView.image.numberOfChannels == 1 &&
               model.flatfieldSizeMinimum <= Math.min(
                  model.flatfieldView.image.width,
                  model.flatfieldView.image.height
               ) &&
               model.imageView.window.mainView.image.width ==
                  model.flatfieldView.image.width &&
               model.imageView.window.mainView.image.height ==
                  model.flatfieldView.image.height
            )
         );
   };

   this.imageViewOnViewSelected = function(view) {
      model.imageView = view;
      this.useImageMetadata();
      this.useImageMetadataUpdateText();
      this.enableControls();
      this.checkImageView();
   };

   this.imageCombinationCountOnTextUpdated = function(text) {
      model.imageCombinationCount = model.defaultNumeric(
         parseInt(text),
         model.imageCombinationCountMinimum,
         model.imageCombinationCountMaximum,
         model.imageCombinationCountDefault
      );
      this.enableControls();
   };

   this.imageInterpolationMethodOnItemSelected = function(item) {
      model.imageInterpolationMethod = item;
      this.enableControls();
   };

   this.flatfieldViewOnViewSelected = function(view) {
      model.flatfieldView = view;
      this.enableControls();
      this.checkFlatfieldView();
   };

   this.detectorGainOnTextUpdated = function(text) {
      model.detectorGain = model.defaultNumeric(
         parseFloat(text),
         model.detectorGainMinimum,
         model.detectorGainMaximum,
         model.detectorGainDefault
      );
      this.enableControls();
   };

   this.detectorGaussianNoiseOnTextUpdated = function(text) {
      model.detectorGaussianNoise = model.defaultNumeric(
         parseFloat(text),
         model.detectorGaussianNoiseMinimum,
         model.detectorGaussianNoiseMaximum,
         model.detectorGaussianNoiseDefault
      );
      this.enableControls();
   };

   this.detectorOffsetOnTextUpdated = function(text) {
      model.detectorOffset = model.defaultNumeric(
         parseFloat(text),
         model.detectorOffsetMinimum,
         model.detectorOffsetMaximum,
         model.detectorOffsetDefault
      );
      this.enableControls();
   };

   this.denoiseVarianceScaleOnTextUpdated = function(text) {
      model.denoiseVarianceScale = model.defaultNumeric(
         parseFloat(text),
         model.denoiseVarianceScaleMinimum,
         model.denoiseVarianceScaleMaximum,
         model.denoiseVarianceScaleDefault
      );
      this.enableControls();
   };

   this.denoiseCycleSpinCountOnTextUpdated = function(text) {
      model.denoiseCycleSpinCount = model.clipNumeric(
         parseInt(text),
         model.denoiseCycleSpinCountMinimum,
         model.denoiseCycleSpinCountMaximum,
         model.denoiseCycleSpinCountDefault
      );
      this.enableControls();
   };

   this.concatMetadataTransform = function(t1, t2) {
      return [
         t2[1] * t1[0] + t2[0],
         t2[1] * t1[1]
      ];
   };

   this.useImageMetadata = function() {
      model.metadataTransform = [0, 1];
      model.usingMetadataTransform = false;

      if (!model.useImageMetadata) {
         return;
      }

      if (model.imageView == null || !model.imageView.isView) {
         return;
      }

      var imageCombinationCount = 0;
      var keywords = model.imageView.window.keywords;
      for (var i = 0; i != keywords.length; ++i) {
         if (keywords[i].name != "HISTORY") {
            continue;
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.numberOfImages: (\d+)/
         );
         if (found != null && found.length == 2) {
            if (!isNaN(parseInt(found[1]))) {
               imageCombinationCount = parseInt(found[1]);
            }
         }
      }
      if (imageCombinationCount < model.imageCombinationCountMinimum) {
         return;
      }
      if (imageCombinationCount > model.imageCombinationCountMaximum) {
         return;
      }

      var pixelCombination = null;
      var outputNormalization = null;
      var weightMode = null;
      var scaleEstimates = new Vector(0, imageCombinationCount);
      var locationEstimates = new Vector(0, imageCombinationCount);
      var imageWeights = new Vector(0, imageCombinationCount);
      var LNModelOffsets = new Vector(0, imageCombinationCount);
      var LNModelScales = new Vector(0, imageCombinationCount);
      var outputRangeLow = 0;
      var outputRangeHigh = 1;
      var outputRangeOperation = "none";
      for (var i = 0; i != keywords.length; ++i) {
         if (keywords[i].name != "HISTORY") {
            continue;
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.pixelCombination: *([a-zA-Z]+)/
         );
         if (found != null && found.length == 2) {
            pixelCombination = found[1];
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.outputNormalization: *([a-zA-Z]+(?: [a-zA-Z+]+)*)/
         );
         if (found != null && found.length == 2) {
            outputNormalization = found[1];
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.weightMode: *([a-zA-Z']+(?: [a-zA-Z]+)*)/
         );
         if (found != null && found.length == 2) {
            weightMode = found[1];
         }

         var found = keywords[i].comment.match(
            /ImageIntegration\.scaleEstimates_(\d+): *([\-+]?\d\.\d+e[\-+]\d+)/
         );
         if (found != null && found.length == 3) {
            var index = parseInt(found[1]);
            var scaleEstimate = parseFloat(found[2]);
            if (
               !isNaN(index) && !isNaN(scaleEstimate) &&
               0 <= index && index < imageCombinationCount &&
               0 < scaleEstimate
            ) {
               scaleEstimates.at(index, scaleEstimate);
            }
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.locationEstimates_(\d+): *([\-+]?\d\.\d+e[\-+]\d+)/
         );
         if (found != null && found.length == 3) {
            var index = parseInt(found[1]);
            var locationEstimate = parseFloat(found[2]);
            if (
               !isNaN(index) && !isNaN(locationEstimate) &&
               0 <= index && index < imageCombinationCount &&
               0 < locationEstimate
            ) {
               locationEstimates.at(index, locationEstimate);
            }
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.imageWeights_(\d+): *([\-+]?\d\.\d+e[\-+]\d+)/
         );
         if (found != null && found.length == 3) {
            var index = parseInt(found[1]);
            var imageWeight = parseFloat(found[2]);
            if (
               !isNaN(index) && !isNaN(imageWeight) &&
               0 <= index && index < imageCombinationCount &&
               0 < imageWeight
            ) {
               imageWeights.at(index, imageWeight);
            }
         }

         var found = keywords[i].comment.match(
            /ImageIntegration\.LNModelOffsets_(\d+): *([\-+]?\d\.\d+e[\-+]\d+)/
         );
         if (found != null && found.length == 3) {
            var index = parseInt(found[1]);
            var offset = parseFloat(found[2]);
            if (
               !isNaN(index) && !isNaN(offset) &&
               0 <= index && index < imageCombinationCount
            ) {
               LNModelOffsets.at(index, offset);
            }
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.LNModelScales_(\d+): *([\-+]?\d\.\d+e[\-+]\d+)/
         );
         if (found != null && found.length == 3) {
            var index = parseInt(found[1]);
            var scale = parseFloat(found[2]);
            if (
               !isNaN(index) && !isNaN(scale) &&
               0 <= index && index < imageCombinationCount &&
               0 < scale
            ) {
               LNModelScales.at(index, scale);
            }
         }

         var found = keywords[i].comment.match(
            /ImageIntegration\.outputRangeLow: *([\-+]?\d\.\d+e[\-+]\d+)/
         );
         if (found != null && found.length == 2) {
            var value = parseFloat(found[1]);
            if (!isNaN(value)) {
               outputRangeLow = value;
            }
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.outputRangeHigh: *([\-+]?\d\.\d+e[\-+]\d+)/
         );
         if (found != null && found.length == 2) {
            var value = parseFloat(found[1]);
            if (!isNaN(value)) {
               outputRangeHigh = value;
            }
         }
         var found = keywords[i].comment.match(
            /ImageIntegration\.outputRangeOperation: *([a-zA-Z]+)/
         );
         if (found != null && found.length == 2) {
            outputRangeOperation = found[1];
         }
      }

      if (pixelCombination == null) {
         return;
      }
      if (pixelCombination.toLowerCase() != "average") {
         return;
      }

      if (outputNormalization == null) {
         return;
      }
      if (outputNormalization.toLowerCase() == "none") {
         for (var i = 0; i != imageCombinationCount; ++i) {
            scaleEstimates.at(i, 1);
            locationEstimates.at(i, 0);
         }
      } else if (outputNormalization.toLowerCase() == "additive") {
         for (var i = 0; i != imageCombinationCount; ++i) {
            scaleEstimates.at(i, 1);
         }
      } else if (outputNormalization.toLowerCase() == "additive + scaling") {
      } else if (outputNormalization.toLowerCase() == "local") {
         return;
      } else {
         return;
      }

      if (weightMode == null) {
         return;
      }
      if (weightMode.toLowerCase() == "don't care") {
         for (var i = 0; i != imageCombinationCount; ++i) {
            imageWeights.at(i, 1);
         }
      }

      if (outputNormalization.toLowerCase() == "local") {
         for (var i = 0; i != imageCombinationCount; ++i) {
            if (LNModelScales.at(i) == 0 || imageWeights.at(i) == 0) {
               return;
            }
         }
      }
      else {
         for (var i = 0; i != imageCombinationCount; ++i) {
            if (scaleEstimates.at(i) == 0 || imageWeights.at(i) == 0) {
               return;
            }
         }
      }

      if (outputNormalization.toLowerCase() == "local") {
         var sumWeights = 0;
         var sumWeightsScales = 0;
         var sumWeightsOffsets = 0;
         for (var i = 0; i != imageCombinationCount; ++i) {
            sumWeights += imageWeights.at(i);
            sumWeightsScales += imageWeights.at(i) * LNModelScales.at(i);
            sumWeightsOffsets += imageWeights.at(i) * LNModelOffsets.at(i);
         }
         var scale = sumWeightsScales / sumWeights;
         var offset = sumWeightsOffsets / sumWeights;
      } else {
         var sumWeights = 0;
         var sumWeightsScaleEstimates = 0;
         var sumWeightsLocationEstimates = 0;
         for (var i = 0; i != imageCombinationCount; ++i) {
            var scaleFactor = scaleEstimates.at(0) / scaleEstimates.at(i);
            sumWeights += imageWeights.at(i);
            sumWeightsScaleEstimates += imageWeights.at(i) * scaleFactor;
            sumWeightsLocationEstimates += imageWeights.at(i) *
               (locationEstimates.at(0) - scaleFactor * locationEstimates.at(i));
         }
         var scale = sumWeightsScaleEstimates / sumWeights;
         var offset = sumWeightsLocationEstimates / sumWeights;
      }

      model.metadataTransform = [offset, scale];
      model.usingMetadataTransform = true;

      if (
         (outputRangeLow < 0 || outputRangeHigh > 1) &&
         outputRangeLow < outputRangeHigh
      ) {
         if (outputRangeOperation.toLowerCase() == "normalize") {
            model.metadataTransform = this.concatMetadataTransform(
               model.metadataTransform,
               [
                  0,
                  1 / outputRangeHigh
               ]
            );
         }
         else if (outputRangeOperation.toLowerCase() == "rescale") {
            model.metadataTransform = this.concatMetadataTransform(
               model.metadataTransform,
               [
                  -outputRangeLow / (outputRangeHigh - outputRangeLow),
                  1 / (outputRangeHigh - outputRangeLow)
               ]
            );
         }
      }

      model.imageCombinationCount = model.defaultNumeric(
         imageCombinationCount,
         model.imageCombinationCountMinimum,
         model.imageCombinationCountMaximum,
         model.imageCombinationCountDefault
      );
      this.view.imageCombinationCountEdit.text = format(
         model.imageCombinationCountFormat,
         model.imageCombinationCount
      );
   }

   this.useImageMetadataOnCheck = function(checked) {
      model.useImageMetadata = checked;
      this.useImageMetadata();
      this.useImageMetadataUpdateText();
      this.enableControls();
   };

   this.useImageMetadataUpdateText = function() {
      if (
         !model.useImageMetadata ||
         model.usingMetadataTransform ||
         (model.imageView == null || !model.imageView.isView)
      ) {
         this.view.useImageMetadataCheckBox.text = "Use image metadata";
      }
      else {
         this.view.useImageMetadataCheckBox.text = "Use image metadata [none]";
      }
   };

   this.includeGradientClassifierOnCheck = function(checked) {
      model.includeGradientClassifier = checked;
      this.enableControls();
   };

   this.generateMethodNoiseImageOnCheck = function(checked) {
      model.generateMethodNoiseImage = checked;
      this.enableControls();
   };

   this.logParameters = function() {
      console.writeln();
      console.writeln("<b>Parameters:</b>");

      console.writeln(format(
         "Image: " + model.imageViewFormat,
         model.imageView.fullId
      ));

      console.writeln(format(
         "Image combination count: " + model.imageCombinationCountFormat,
         model.imageCombinationCount
      ));
      if (model.imageCombinationCount != 1) {
         console.writeln(format(
            "Image interpolation method: " +
            model.imageInterpolationMethodFormat,
            model.imageInterpolationMethodNames[model.imageInterpolationMethod]
         ));
      }

      if (model.flatfieldView != null && model.flatfieldView.isView) {
         console.writeln(format(
            "Flatfield: " + model.flatfieldViewFormat,
            model.flatfieldView.fullId
         ));
      }

      console.writeln(format(
         "Detector gain: " + model.detectorGainFormat +
         " " + model.detectorGainUnits,
         model.detectorGain
      ));
      console.writeln(format(
         "Detector Gaussian noise: " + model.detectorGaussianNoiseFormat +
         " " + model.detectorGaussianNoiseUnits,
         model.detectorGaussianNoise
      ));
      console.writeln(format(
         "Detector offset: " + model.detectorOffsetFormat +
         " " + model.detectorOffsetUnits,
         model.detectorOffset
      ));

      console.writeln(format(
         "Denoise variance scale: " + model.denoiseVarianceScaleFormat,
         model.denoiseVarianceScale
      ));
      console.writeln(format(
         "Denoise cycle-spin count: " + model.denoiseCycleSpinCountFormat,
         model.denoiseCycleSpinCount
      ));
      console.writeln(format(
         "Use image metadata: " +
         (model.useImageMetadata ?
            (model.usingMetadataTransform ?
               "true [scale: %e, offset: %e]" :
               "true [none]"
            ) :
            "false"
         ),
         model.metadataTransform[1],
         model.metadataTransform[0]
      ));
      console.writeln(format(
         "Include gradient classifier: " +
         (model.includeGradientClassifier ? "true" : "false")
      ));
      console.writeln(format(
         "Generate method noise image: " +
         (model.generateMethodNoiseImage ? "true" : "false")
      ));

      console.flush();
   };

   this.denoise = function() {
      this.disableControls();
      this.view.enableAbort();
      console.show();
      if (false) {
         console.writeln();
         console.warningln("FrameMatrix count: ", globalFrameMatrixCount);
      }
      console.flush();

      console.beginLog();
      console.writeln();
      console.writeln("<b>" + TITLE + " Version " + VERSION + "</b>");
      console.flush();

      try {
         this.logParameters();

         var time = -(new Date()).getTime();

         (new MureEstimator(model, this.view)).denoise();

         time += (new Date()).getTime();
         console.writeln(format("%.03f s", 0.001 * time));
         console.flush();
      }
      catch (exception) {
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
                  "<p>Denoise aborted.</p>",
                  TITLE,
                  StdIcon_Error,
                  StdButton_Ok
               )).execute();
            }
         }
      }

      if (false) {
         console.writeln();
         console.warningln("FrameMatrix count: ", globalFrameMatrixCount);
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

   this.addViewList = function(pane, all, view, onViewSelected) {
      var viewList = new ViewList(this);
      pane.add(viewList);

      if (all) {
         viewList.getAll();
      } else {
         viewList.getMainViews();
      }
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

   this.addEdit = function(
      pane, text, toolTip, onTextUpdated, onEditCompleted
   ) {
      var edit = new Edit(this);
      pane.add(edit);

      edit.setFixedWidth(this.editWidth);
      edit.text = text;
      edit.toolTip = toolTip;
      edit.onTextUpdated = onTextUpdated;
      edit.onEditCompleted = onEditCompleted;

      return edit;
   };

   this.addUnits = function(pane, text) {
      var label = new Label(this);
      pane.add(label);

      label.setFixedWidth(this.unitWidth);
      label.text = text;
      label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

      return label;
   };

   this.addComboBox = function(
      pane, items, currentItem, toolTip, onItemSelected
   ) {
      var comboBox = new ComboBox(this);
      pane.add(comboBox);

      for (var i = 0; i != items.length; ++i) {
         comboBox.addItem(items[i]);
      }
      comboBox.currentItem = currentItem;
      comboBox.toolTip = toolTip;
      comboBox.onItemSelected = onItemSelected;

      return comboBox;
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

   this.addCheckBox = function(pane, text, toolTip, checked, onCheck) {
      var checkBox = new CheckBox(this);
      pane.add(checkBox);

      checkBox.text = text;
      checkBox.toolTip = toolTip;
      checkBox.checked = checked;
      checkBox.onCheck = onCheck;

      return checkBox;
   };

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   this.labelWidth = this.font.width("Interpolation method:")
   this.editWidth = this.font.width("0000000000");
   this.unitWidth = this.font.width(model.detectorGainUnits);

   {
      this.imageGroupBox = this.addGroupBox("Image");

      {
         this.imageViewPane = this.addPane(this.imageGroupBox);

         this.imageViewList = this.addViewList(
            this.imageViewPane,
            true,
            null,
            function(view) {
               controller.imageViewOnViewSelected(view);
            }
         );
         this.imageViewListNull = this.imageViewList.currentView;

         this.imageViewHelpButton = this.addToolButton(
            this.imageViewPane,
            ":/icons/comment.png",
            "<p>The view of the linear monochannel image selected for " +
            "denoising. The image must be a single frame image or an " +
            "average combination of similarly exposed and registered " +
            "frames. The size of the image must be at least 256 pixels " +
            "in width and height.</p>" +

            "<p><b>Note</b>: For linear multichannel images from monocolor " +
            "detectors, run the monochannel denoiser on each channel " +
            "separately. The script does not work properly for images from one " +
            "shot color (OSC) detectors.</p>" +

            "<p><b>Warning</b>: The script is adapted to denoise linear " +
            "monochannel images mainly corrupted by shot noise, read noise, " +
            "and dark current noise which is typically the case for " +
            "astronomical data. The script does not work properly for other " +
            "noise distributions, for saturated images, for debayered images, " +
            "for upsampled or downsampled images, for linearly or nonlinearly " +
            "processed images, for median combinations, or for drizzle " +
            "combinations.</p>" +

            "<p><b>Warning</b>: Do not combine denoised images. Signal-to-" +
            "noise ratio (SNR) will be enhanced by combining noisy images and " +
            "denoising the result. Combined images must be equally exposed, " +
            "have the same pixel resolution, and be registered by projective " +
            "transformation with no distortion correction.</p>",
            function() {}
         );
      }

      {
         this.imageCombinationCountPane = this.addPane(this.imageGroupBox);

         this.imageCombinationCountLabel = this.addLabel(
            this.imageCombinationCountPane,
            "Combination count:",
            "<p>The combination count of the image.</p>" +

            "<p><i>Combination count</i> must be set to 1 for single " +
            "frame images.</p>" +

            "<p><i>Combination count</i> must be set to &eta; for average " +
            "combinations of &eta; equally exposed and registered frames.</p>"
         );

         this.imageCombinationCountEdit = this.addEdit(
            this.imageCombinationCountPane,
            format(
               model.imageCombinationCountFormat,
               model.imageCombinationCount
            ),
            this.imageCombinationCountLabel.toolTip,
            function(text) {
               controller.imageCombinationCountOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.imageCombinationCountFormat,
                  model.imageCombinationCount
               );
            }
         );

         this.imageCombinationCountUnits = this.addUnits(
            this.imageCombinationCountPane,
            model.imageCombinationCountUnits
         );

         this.imageCombinationCountPane.addStretch();
      }

      {
         this.imageInterpolationMethodPane = this.addPane(this.imageGroupBox);

         this.imageInterpolationMethodLabel = this.addLabel(
            this.imageInterpolationMethodPane,
            "Interpolation method:",
            "<p>The interpolation method used to register images for " +
            "combination, as defined by the <i>StarAlignment</i> " +
            "process.</p>" +

            "<p><i>Interpolation method</i> must be set equal to the " +
            "<i>StarAlignment</i> process parameter <i>Interpolation</i> > " +
            "<i>Pixel interpolation</i>. When <i>Auto</i> was selected as " +
            "the <i>StarAlignment</i> pixel interpolation parameter, " +
            "interpolation method must be set equal to the value recorded " +
            "in the <i>StarAlignment</i> process log.</p>"
         );

         this.imageInterpolationMethodComboBox = this.addComboBox(
            this.imageInterpolationMethodPane,
            model.imageInterpolationMethodNames,
            model.imageInterpolationMethod,
            this.imageInterpolationMethodLabel.toolTip,
            function(item) {
               controller.imageInterpolationMethodOnItemSelected(item)
            }
         );

         this.imageInterpolationMethodPane.addStretch();
      }
   }

   {
      this.flatfieldGroupBox = this.addGroupBox("Flatfield");

      {
         this.flatfieldViewPane = this.addPane(this.flatfieldGroupBox);

         this.flatfieldViewList = this.addViewList(
            this.flatfieldViewPane,
            false,
            model.flatfieldView,
            function(view) {
               controller.flatfieldViewOnViewSelected(view);
            }
         );
         this.flatfieldViewListNull = View.viewById("");

         this.flatfieldViewHelpButton = this.addToolButton(
            this.flatfieldViewPane,
            ":/icons/comment.png",
            "<p>To enable large scale flatfield compensation, the main view " +
            "of the monochannel image used for flatfield calibration. The " +
            "flatfield must be bias or dark-subtracted. Pedestal must be " +
            "zero. To disable flatfield compensation, do not select a " +
            "view.</p>" +

            "<p>The sizes of the main view of the image selected for " +
            "denoising and the main view of the flatfield must be equal.</p>" +

            "<p>The standard deviation of the smoothed flatfield is written " +
            "to the process console as the <i>Flatfield scale</i> value. The " +
            "value is normalized as a percentage of the mean of the smoothed " +
            "flatfield.</p>",
            function() {}
         );
      }
   }

   {
      this.detectorGroupBox = this.addGroupBox("Detector");

      {
         this.detectorGainPane = this.addPane(this.detectorGroupBox);

         this.detectorGainLabel = this.addLabel(
            this.detectorGainPane,
            "Gain:",
            "<p>The gain of the detector in " + model.detectorGainUnits +
            ".</p>" +

            "<p>If detector gain is unknown, the " +
            "<i>MureDenoiseDetectorSettings</i> script can provide an " +
            "estimate.</p>" +

            "<p>Manufacture detector specifications may provide a gain value " +
            "in " + model.detectorGainUnits + ". This value may be used, " +
            "with the risk that it may not correspond well to the actual " +
            "detector configuration and performance. In general, the " +
            "<i>MureDenoiseDetectorSettings</i> script estimate is more " +
            "reliable.</p>"
         );

         this.detectorGainEdit = this.addEdit(
            this.detectorGainPane,
            format(
               model.detectorGainFormat,
               model.detectorGain
            ),
            this.detectorGainLabel.toolTip,
            function(text) {
               controller.detectorGainOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.detectorGainFormat,
                  model.detectorGain
               );
            }
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
            "<p>The standard deviation of Gaussian noise of the detector in " +
            model.detectorGaussianNoiseUnits + ".</p>" +

            "<p>If detector gain is unknown, the " +
            "<i>MureDenoiseDetectorSettings</i> script can provide an " +
            "estimate.</p>" +

            "<p>Manufacture detector specifications may provide a read noise " +
            "value in e-. This value, when divided by detector gain to " +
            "obtain a value in " + model.detectorGaussianNoiseUnits + ", may " +
            "be used, with the risk that it may not correspond well to the " +
            "actual detector configuration and performance. In general, the " +
            "<i>MureDenoiseDetectorSettings</i> script estimate is more " +
            "reliable.</p>"
         );

         this.detectorGaussianNoiseEdit = this.addEdit(
            this.detectorGaussianNoisePane,
            format(
               model.detectorGaussianNoiseFormat,
               model.detectorGaussianNoise
            ),
            this.detectorGaussianNoiseLabel.toolTip,
            function(text) {
               controller.detectorGaussianNoiseOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.detectorGaussianNoiseFormat,
                  model.detectorGaussianNoise
               );
            }
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
            "<p>The offset of the detector in " + model.detectorOffsetUnits +
            ".</p>" +

            "<p>Detector offset must be set to 0 for a bias or " +
            "dark-subtracted image, unless the image has a non-zero " +
            "pedestal, in which case offset must be set equal to the " +
            "pedestal.</p>"
         );

         this.detectorOffsetEdit = this.addEdit(
            this.detectorOffsetPane,
            format(
               model.detectorOffsetFormat,
               model.detectorOffset
            ),
            this.detectorOffsetLabel.toolTip,
            function(text) {
               controller.detectorOffsetOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.detectorOffsetFormat,
                  model.detectorOffset
               );
            }
         );

         this.detectorOffsetUnits = this.addUnits(
            this.detectorOffsetPane,
            model.detectorOffsetUnits
         );

         this.detectorOffsetPane.addStretch();
      }
   }

   {
      this.denoiseGroupBox = this.addGroupBox("Denoise");

      {
         this.denoiseVarianceScalePane = this.addPane(this.denoiseGroupBox);

         this.denoiseVarianceScaleLabel = this.addLabel(
            this.denoiseVarianceScalePane,
            "Variance scale:",
            "<p>This parameter scales hypothesis noise variance. A value of " +
            "one corresponds to nominal hypothesis noise variance and a " +
            "corresponding nominal amount of denoising. A value less than " +
            "one will reduce the amount of denoising. A value greater than " +
            "one will increase the amount of denoising.</p>" +

            "<p><b>Warning</b>: Excessively large variance scale values " +
            "risk the generation of denoising artifacts and the loss of " +
            "signal-to-noise ratio (SNR). Denoising artifacts typically " +
            "take on a “checkerboard” pattern, visible with high stretch " +
            "in the background areas of the denoised image.</p>"
         );

         this.denoiseVarianceScaleEdit = this.addEdit(
            this.denoiseVarianceScalePane,
            format(
               model.denoiseVarianceScaleFormat,
               model.denoiseVarianceScale
            ),
            this.denoiseVarianceScaleLabel.toolTip,
            function(text) {
               controller.denoiseVarianceScaleOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.denoiseVarianceScaleFormat,
                  model.denoiseVarianceScale
               );
            }
         );

         this.denoiseVarianceScaleUnits = this.addUnits(
            this.denoiseVarianceScalePane,
            model.denoiseVarianceScaleUnits
         );

         this.denoiseVarianceScalePane.addStretch();
      }

      {
         this.denoiseCycleSpinCountPane = this.addPane(this.denoiseGroupBox);

         this.denoiseCycleSpinCountLabel = this.addLabel(
            this.denoiseCycleSpinCountPane,
            "Cycle-spin count:",
            "<p><i>Cycle-spin count</i> provides an adjustable trade-off " +
            "between output quality and processing time. Increasing the " +
            "number of cycle-spins improves denoising quality, but also " +
            "increases (nearly linearly) processing time.</p>" +

            "<p>The script works at multiple resolutions. To create the " +
            "coarser resolutions, the script combines pixels from finer " +
            "resolutions. There are multiple ways to choose which pixels " +
            "to combine. Each cycle-spin chooses different pixels to " +
            "combine, and performs a complete denoising operation. The " +
            "results from all of the cycle-spins are averaged together to " +
            "produced the final result. The net effect is to average out " +
            "the variations in noise estimation due to pixel choice, and " +
            "so gives a better result.</p>" +

            "<p>The default cycle-spin count of 8 typically provides very " +
            "good quality results in reasonable time.</p>"
         );

         this.denoiseCycleSpinCountEdit = this.addEdit(
            this.denoiseCycleSpinCountPane,
            format(
               model.denoiseCycleSpinCountFormat,
               model.denoiseCycleSpinCount
            ),
            this.denoiseCycleSpinCountLabel.toolTip,
            function(text) {
               controller.denoiseCycleSpinCountOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.denoiseCycleSpinCountFormat,
                  model.denoiseCycleSpinCount
               );
            }
         );

         this.denoiseCycleSpinCountUnits = this.addUnits(
            this.denoiseCycleSpinCountPane,
            model.denoiseCycleSpinCountUnits
         );

         this.denoiseCycleSpinCountPane.addStretch();
      }

      {
         this.useImageMetadataPane = this.addPane(this.denoiseGroupBox);

         this.useImageMetadataPane.addUnscaledSpacing(this.labelWidth);

         this.useImageMetadataPane.addSpacing(
            this.useImageMetadataPane.spacing
         );

         this.useImageMetadataCheckBox = this.addCheckBox(
            this.useImageMetadataPane,
            "Use image metadata",
            "<p>Use <i>ImageIntegration</i> generated image metadata to " +
            "estimate a linear image transformation that accounts for the " +
            "process's integration normalization, weighting, and output " +
            "rescaling operations. Also loads <i>Combination count</i>.</p>" +

            "<p>The following <i>ImageIntegration</i> settings are " +
            "supported: <i>Image integration</i> > <i>Combination</i>: " +
            "<i>Average</i>. <i>Image integration</i> > " +
            "<i>Normalization</i>: <i>No normalization</i>, <i>Additive</i>, " +
            "or <i>Additive with scaling</i>. " +
            "<i>Image integration</i> > <i>Weights</i>: all values.</p>" +

            "<p>The parameters of the linear image transformation used are " +
            "logged in the process console during the denoising process.</p>" +

            "<p>The keyword <i>none</i> indicates either unavailable image " +
            "metadata or unsupported <i>ImageIntegration</i> settings.</p>",
            model.useImageMetadata,
            function(checked) {
               controller.useImageMetadataOnCheck(checked);
            }
         );

         this.useImageMetadataPane.addStretch();
      }

      {
         this.includeGradientClassifierPane = this.addPane(this.denoiseGroupBox);

         this.includeGradientClassifierPane.addUnscaledSpacing(this.labelWidth);

         this.includeGradientClassifierPane.addSpacing(
            this.includeGradientClassifierPane.spacing
         );

         this.includeGradientClassifierCheckBox = this.addCheckBox(
            this.includeGradientClassifierPane,
            "Include gradient classifier",
            "<p>Include a gradient classifier that exploits local gradient " +
            "squared magnitude to local noise variance ratio relationships " +
            "to provide an increase in the adaptivity and accuracy of the " +
            "denoising process, but also increases processing time by about " +
            "50%.</p>",
            model.includeGradientClassifier,
            function(checked) {
               controller.includeGradientClassifierOnCheck(checked);
            }
         );

         this.includeGradientClassifierPane.addStretch();
      }

      {
         this.generateMethodNoiseImagePane = this.addPane(this.denoiseGroupBox);

         this.generateMethodNoiseImagePane.addUnscaledSpacing(this.labelWidth);

         this.generateMethodNoiseImagePane.addSpacing(
            this.generateMethodNoiseImagePane.spacing
         );

         this.generateMethodNoiseImageCheckBox = this.addCheckBox(
            this.generateMethodNoiseImagePane,
            "Generate method noise image",
            "<p>Generate the method noise of the denoising process as a new " +
            "image window. Method noise is the noise guessed by the " +
            "denoising method, defined as the difference between the noisy " +
            "input and the denoised output. Method noise should track " +
            "hypothesis noise statistics, and is strongly signal dependent " +
            "due to the presence of Poisson noise.</p>" +

            "<p>The standard deviation of the method noise image is written " +
            "to the process console as the <i>Method noise</i> value in DN " +
            "units. The process log will also contain an estimate of the " +
            "relative contributions of Poisson noise variance and Gaussian " +
            "noise variance in the 10th percentile exposure. If the Gaussian " +
            "noise variance contribution is less than 10\%, the image can be " +
            "considered \"sky background noise limited\".</p>",
            model.generateMethodNoiseImage,
            function(checked) {
               controller.generateMethodNoiseImageOnCheck(checked);
            }
         );

         this.generateMethodNoiseImagePane.addStretch();
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

         "<p>Script for denoising linear monochannel images corrupted by " +
         "mixed Poisson-Gaussian noise. Applicable to single frame images " +
         "and average combinations of equally exposed and registered " +
         "frames.</p>" +

         "<p>The script supports an astronomical image processing workflow " +
         "in which the denoising step occurs immediately after the " +
         "calibration and optional average combination steps and prior to " +
         "other linear or nonlinear processing steps.</p>" +

         "<p>The script applies a Haar-wavelet mixed noise unbiased " +
         "risk estimator (MURE) to find a denoised output image that " +
         "minimizes an estimate of the oracle mean-squared error (MSE) " +
         "between the denoised output image and the unknown noise-free " +
         "image.</p>" +

         "<p><b>Note</b>: For linear multichannel images from monocolor " +
         "detectors, run the monochannel denoiser on each channel " +
         "separately. The script does not work properly for images from one " +
         "shot color (OSC) detectors.</p>" +

         "<p><b>Warning</b>: The script is adapted to denoise linear " +
         "monochannel images mainly corrupted by shot noise, read noise, " +
         "and dark current noise which is typically the case for " +
         "astronomical data. The script does not work properly for other " +
         "noise distributions, for saturated images, for debayered images, " +
         "for upsampled or downsampled images, for linearly or nonlinearly " +
         "processed images, for median combinations, or for drizzle " +
         "combinations.</p>" +

         "<p><b>Warning</b>: Do not combine denoised images. Signal-to-" +
         "noise ratio (SNR) will be enhanced by combining noisy images and " +
         "denoising the result. Combined images must be equally exposed, " +
         "have the same pixel resolution, and be registered by projective " +
         "transformation with no distortion correction.</p>" +

         "<p>Copyright &copy; 2012-2020 Mike Schuster. All Rights " +
         "Reserved.<br>" +
         "Copyright &copy; 2003-2020 Pleiades Astrophoto S.L. All Rights " +
         "Reserved.</p>"
      );
      this.versionLabel.setVariableWidth();

      this.buttonPane.addStretch();

      this.denoiseButton = this.addPushButton(
         this.buttonPane,
         "Denoise",
         "<p>Denoise the image.</p>",
         function() {
            controller.denoise();
         }
      );

      this.dismissAbortButton = this.addPushButton(
         this.buttonPane,
         "Dismiss",
         "<p>Dismiss the dialog.</p>",
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
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(0));
   this.setFixedHeight(this.height + this.logicalPixelsToPhysical(20));

   this.disableAbort();
}
MainView.prototype = new Dialog;

// ****************************************************************************
// EOF MainViewController.js - Released 2020/01/21 00:00:00 UTC
