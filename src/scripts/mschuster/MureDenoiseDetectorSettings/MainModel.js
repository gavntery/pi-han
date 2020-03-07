// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainModel.js - Released 2020/01/21 00:00:00 UTC
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

function MainModel() {
   // Calibration frames.
   this.flatFrame1View = null;
   this.flatFrame2View = null;
   this.biasFrame1View = null;
   this.biasFrame2View = null;
   this.frameViewFormat = "%s";

   // Calibration frame medians.
   this.flatFrame1Median = 0;
   this.flatFrame2Median = 0;
   this.biasFrame1Median = 0;
   this.biasFrame2Median = 0;

   // Minimum frame size, frame ratios, and crop factor.
   this.frameSizeMinimum = 256;
   this.flatFrameRatioMinimum = 0.9;
   this.biasFrameRatioMinimum = 0.9;
   this.cropFactor = 0.5 * (1 - Math.sqrt(0.5));

   // Flat frame exposure.
   this.flatFrameExposureDefault = 0;
   this.flatFrameExposureFormat = "%.0f";
   this.flatFrameExposureUnits = "e-";
   this.flatFrameExposure = this.flatFrameExposureDefault;

   // Detector gain.
   this.detectorGainDefault = 0;
   this.detectorGainFormat = "%.3f";
   this.detectorGainUnits = "e-/DN";
   this.detectorGain = this.detectorGainDefault;

   // Detector Gaussian noise.
   this.detectorGaussianNoiseDefault = 0;
   this.detectorGaussianNoiseFormat = "%.2f";
   this.detectorGaussianNoiseUnits = "DN";
   this.detectorGaussianNoise = this.detectorGaussianNoiseDefault;

   // Detector offset.
   this.detectorOffsetDefault = 0;
   this.detectorOffsetFormat = "%.1f";
   this.detectorOffsetUnits = "DN";
   this.detectorOffset = this.detectorOffsetDefault;

   // Gives string if well defined, otherwise a default.
   this.defaultString = function(str, def) {
      return str != null ? str : def;
   }

   // Loads core settings.
   this.loadSettings = function() {
      // this.defaultString(Settings.read("version", DataType_String8), "");
   };

   // Stores core settings.
   this.storeSettings = function() {
      Settings.write("version", DataType_String8, VERSION);
   };

   // Loads instance parameters.
   this.loadParameters = function() {
   };

   // Stores instance parameters.
   this.storeParameters = function() {
      Parameters.clear();

      Parameters.set("version", VERSION);
   };

   // Clears the model.
   this.clear = function() {
      this.flatFrame1View = null;
      this.flatFrame2View = null;
      this.biasFrame1View = null;
      this.biasFrame2View = null;
   };
}

// ****************************************************************************
// EOF MainModel.js - Released 2020/01/21 00:00:00 UTC
