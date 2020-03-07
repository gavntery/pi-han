// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MureEstimator.js - Released 2020/01/21 00:00:00 UTC
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

function MureEstimator(model, view) {
   // Locations to log.
   this.logLocations = [
      // new Point(x, y), ...
   ];

   // Gives padded and shifted locations to log.
   this.padShiftLogLocations = function(
      logLocations, pad, shiftRows, shiftCols
   ) {
      var locations = new Array(logLocations.length);
      for (var i = 0; i != locations.length; ++i) {
         locations[i] = new Point(
            logLocations[i].x + pad + shiftCols,
            logLocations[i].y + pad + shiftRows
         );
      }

      return locations;
   };

   // Gives levels of refinement as a function of image size.
   this.generateLevelsOfRefinement = function() {
      return 5;
   };

   // Gives randomized cycle spin locations as a function of cycle spin count.
   this.generateCycleSpinLocations = function(cycleSpinCount) {
      var coordinates = [
         [23, 20],
         [20, 1, 5, 17],
         [6, 20, 29, 6, 13, 3],
         [5, 18, 22, 28, 8, 1, 21, 13],
         [0, 0, 25, 13, 10, 8, 16, 25, 4, 20],
         [6, 23, 19, 6, 31, 5, 21, 26, 27, 16, 9, 11],
         [7, 25, 5, 9, 26, 1, 20, 12, 15, 2, 17, 22, 30, 17],
         [9, 25, 25, 22, 5, 4, 18, 7, 30, 11, 8, 15, 28, 0, 18, 29],
         [29, 29, 22, 22, 28, 14, 12, 20, 15, 8, 8, 31, 19, 0, 5, 11,
         3, 20],
         [26, 15, 14, 8, 28, 29, 29, 6, 18, 0, 6, 1, 5, 10, 11, 21,
         20, 23, 2, 22],
         [27, 26, 11, 28, 30, 2, 12, 16, 9, 5, 19, 31, 19, 8, 28, 16,
         4, 12, 19, 21, 4, 23],
         [26, 8, 5, 19, 28, 17, 21, 22, 18, 11, 6, 7, 13, 26, 1, 0,
         23, 31, 13, 2, 13, 18, 29, 25],
         [11, 19, 21, 8, 2, 12, 7, 6, 17, 0, 29, 20, 8, 30, 28, 28,
         22, 16, 20, 24, 29, 5, 14, 12, 4, 23],
         [15, 19, 7, 16, 2, 22, 30, 6, 7, 7, 8, 26, 15, 10, 0, 29,
         13, 1, 25, 15, 17, 27, 22, 5, 24, 25, 0, 13],
         [2, 0, 12, 27, 23, 28, 29, 13, 20, 19, 30, 26, 15, 9, 13, 2,
         21, 3, 12, 20, 5, 20, 29, 5, 9, 13, 3, 9, 22, 11],
         [22, 11, 15, 15, 12, 23, 10, 9, 3, 14, 23, 21, 18, 3, 5, 21,
         18, 26, 27, 2, 2, 6, 30, 20, 29, 11, 8, 2, 30, 28, 5, 28],
         [3, 19, 8, 25, 26, 14, 2, 2, 28, 28, 11, 11, 10, 2, 21, 25,
         24, 7, 17, 31, 14, 20, 29, 21, 1, 12, 15, 6, 6, 7, 19, 11,
         20, 18],
         [13, 17, 6, 25, 16, 23, 10, 2, 20, 30, 31, 31, 22, 8, 26, 23,
         20, 17, 27, 13, 3, 17, 8, 13, 15, 11, 31, 7, 6, 7, 12, 28,
         16, 4, 25, 2],
         [3, 15, 1, 21, 3, 28, 23, 21, 17, 23, 28, 26, 30, 1, 22, 14,
         12, 18, 14, 7, 9, 30, 6, 5, 7, 23, 26, 9, 22, 2, 28, 17,
         1, 9, 9, 12, 15, 0],
         [5, 10, 29, 9, 4, 21, 23, 7, 12, 6, 14, 31, 19, 13, 24, 27,
         24, 17, 31, 3, 21, 1, 8, 30, 31, 16, 30, 29, 30, 22, 6, 4,
         15, 18, 12, 24, 20, 22, 11, 12],
         [9, 26, 1, 24, 30, 15, 26, 10, 3, 3, 20, 5, 4, 11, 20, 19,
         8, 18, 16, 27, 24, 25, 27, 20, 27, 30, 12, 10, 14, 18, 9, 2,
         19, 11, 29, 4, 15, 2, 21, 30, 4, 29],
         [17, 17, 24, 19, 12, 22, 17, 7, 8, 28, 23, 11, 29, 11, 17, 30,
         21, 24, 31, 20, 24, 30, 0, 26, 10, 12, 22, 4, 7, 17, 7, 6,
         3, 31, 28, 3, 1, 7, 13, 2, 2, 14, 5, 23],
         [26, 1, 23, 7, 24, 16, 1, 4, 2, 28, 8, 3, 16, 7, 24, 27,
         29, 8, 18, 28, 30, 22, 20, 2, 8, 19, 5, 14, 12, 29, 13, 22,
         31, 16, 21, 21, 7, 25, 17, 17, 12, 12, 5, 8, 20, 12],
         [7, 20, 17, 20, 8, 13, 3, 28, 23, 24, 6, 5, 13, 16, 12, 22,
         11, 30, 17, 27, 12, 4, 21, 31, 27, 0, 20, 7, 1, 2, 29, 6,
         25, 19, 20, 13, 28, 26, 13, 10, 3, 10, 2, 18, 29, 15, 25, 10],
         [28, 17, 4, 20, 11, 16, 25, 23, 22, 14, 19, 22, 29, 8, 0, 13,
         31, 28, 22, 30, 9, 27, 17, 27, 27, 1, 11, 1, 6, 11, 31, 22,
         23, 8, 16, 5, 13, 23, 4, 30, 11, 7, 17, 11, 1, 3, 6, 5,
         17, 17],
         [24, 4, 24, 29, 30, 0, 16, 31, 16, 24, 14, 5, 29, 25, 3, 24,
         9, 3, 27, 10, 11, 19, 13, 12, 0, 8, 31, 18, 21, 16, 6, 11,
         11, 29, 23, 24, 26, 19, 1, 13, 9, 24, 20, 8, 16, 17, 6, 18,
         5, 30, 4, 4],
         [26, 16, 18, 14, 15, 21, 3, 16, 24, 7, 29, 2, 23, 30, 10, 19,
         1, 25, 19, 2, 17, 26, 25, 21, 28, 26, 7, 26, 14, 6, 9, 13,
         31, 20, 31, 12, 13, 0, 5, 2, 5, 21, 20, 20, 8, 7, 4, 11,
         12, 27, 1, 6, 19, 9],
         [8, 3, 13, 11, 10, 30, 3, 4, 17, 4, 6, 12, 3, 16, 2, 9,
         19, 27, 29, 5, 12, 19, 29, 14, 30, 0, 21, 21, 22, 3, 2, 21,
         20, 9, 28, 23, 19, 15, 3, 29, 9, 8, 25, 29, 7, 20, 9, 25,
         26, 18, 26, 10, 16, 23, 15, 31],
         [28, 7, 21, 7, 31, 12, 4, 2, 9, 31, 17, 1, 20, 29, 1, 29,
         26, 29, 4, 24, 15, 11, 19, 23, 19, 18, 22, 2, 10, 26, 12, 7,
         31, 22, 7, 6, 24, 22, 8, 11, 30, 2, 23, 14, 8, 21, 11, 17,
         2, 8, 2, 16, 15, 26, 27, 17, 14, 21],
         [12, 5, 5, 0, 15, 28, 8, 9, 20, 5, 28, 2, 14, 10, 18, 0,
         22, 15, 10, 31, 23, 1, 19, 19, 13, 22, 2, 10, 19, 25, 7, 23,
         9, 14, 2, 4, 0, 28, 2, 23, 28, 8, 19, 10, 1, 16, 29, 13,
         15, 16, 24, 28, 23, 22, 27, 19, 6, 18, 28, 25],
         [17, 16, 23, 8, 22, 3, 19, 11, 14, 6, 28, 6, 15, 1, 25, 30,
         9, 3, 31, 30, 29, 25, 10, 29, 9, 8, 24, 24, 10, 13, 23, 19,
         4, 9, 5, 22, 2, 4, 16, 28, 26, 12, 18, 21, 2, 26, 5, 31,
         12, 18, 30, 15, 10, 24, 28, 20, 4, 15, 31, 10, 1, 19],
         [1, 27, 30, 21, 28, 31, 27, 16, 4, 0, 8, 26, 30, 5, 29, 10,
         11, 2, 19, 5, 21, 18, 25, 4, 21, 0, 21, 23, 5, 18, 20, 13,
         26, 24, 18, 28, 7, 8, 15, 8, 12, 29, 11, 12, 14, 20, 23, 9,
         4, 23, 9, 21, 16, 1, 1, 15, 15, 15, 3, 5, 2, 10, 6, 13],
         [20, 28, 25, 0, 22, 6, 25, 27, 0, 4, 4, 8, 20, 22, 1, 30,
         0, 21, 5, 1, 24, 17, 21, 11, 15, 19, 30, 26, 20, 1, 5, 14,
         11, 4, 26, 22, 9, 29, 5, 24, 14, 0, 29, 17, 30, 9, 26, 12,
         6, 19, 27, 5, 19, 16, 15, 25, 13, 12, 17, 5, 9, 9, 10, 16,
         10, 23],
         [24, 29, 21, 1, 14, 31, 12, 5, 31, 27, 7, 31, 4, 6, 30, 3,
         13, 13, 2, 13, 22, 24, 17, 10, 9, 11, 24, 8, 17, 20, 18, 5,
         25, 3, 4, 25, 26, 22, 21, 12, 29, 8, 26, 13, 2, 0, 29, 17,
         3, 20, 19, 28, 13, 18, 28, 31, 23, 18, 17, 15, 13, 26, 31, 22,
         7, 18, 9, 23],
         [6, 18, 7, 11, 10, 23, 0, 7, 7, 5, 11, 30, 3, 27, 11, 15,
         16, 2, 1, 31, 16, 7, 23, 6, 12, 5, 4, 22, 14, 20, 31, 16,
         27, 13, 5, 1, 13, 11, 21, 11, 30, 21, 24, 1, 2, 11, 30, 3,
         20, 26, 19, 20, 25, 21, 22, 16, 17, 13, 27, 8, 28, 31, 30, 26,
         25, 27, 15, 26, 20, 31],
         [26, 5, 21, 3, 30, 10, 20, 10, 12, 10, 25, 12, 2, 4, 28, 30,
         0, 28, 23, 31, 13, 18, 15, 23, 21, 18, 18, 27, 2, 17, 28, 17,
         6, 0, 25, 21, 6, 25, 2, 23, 5, 13, 11, 31, 8, 19, 10, 23,
         13, 27, 22, 25, 10, 14, 14, 3, 7, 9, 10, 5, 16, 8, 16, 31,
         30, 2, 28, 25, 17, 15, 30, 21],
         [12, 10, 13, 4, 18, 2, 22, 27, 7, 2, 28, 24, 21, 22, 16, 8,
         5, 9, 3, 27, 10, 30, 10, 22, 22, 16, 29, 19, 27, 13, 17, 16,
         9, 15, 5, 20, 24, 8, 13, 18, 3, 13, 24, 0, 20, 11, 2, 0,
         1, 17, 3, 5, 28, 6, 12, 26, 20, 6, 17, 26, 15, 22, 29, 29,
         15, 30, 1, 22, 30, 2, 9, 6, 31, 10],
         [29, 29, 1, 27, 24, 27, 6, 31, 10, 3, 23, 19, 29, 13, 30, 22,
         13, 0, 16, 15, 27, 1, 17, 28, 9, 28, 31, 3, 21, 30, 1, 7,
         28, 6, 1, 15, 5, 25, 23, 10, 4, 11, 21, 4, 4, 20, 9, 10,
         17, 22, 21, 24, 11, 21, 18, 1, 6, 7, 4, 3, 6, 15, 14, 6,
         12, 13, 19, 8, 20, 13, 13, 26, 25, 15, 28, 18],
         [16, 2, 9, 5, 14, 29, 8, 11, 15, 7, 3, 7, 7, 30, 4, 2,
         20, 7, 22, 13, 14, 13, 11, 1, 18, 11, 22, 3, 27, 7, 14, 18,
         14, 24, 9, 24, 30, 4, 22, 18, 6, 16, 19, 31, 18, 26, 31, 20,
         0, 14, 4, 21, 19, 21, 0, 0, 23, 26, 25, 30, 29, 26, 25, 22,
         1, 24, 18, 16, 28, 12, 26, 16, 31, 9, 9, 19, 5, 26],
         [16, 18, 12, 12, 20, 23, 20, 13, 17, 28, 15, 7, 16, 11, 9, 8,
         23, 20, 28, 23, 17, 2, 31, 29, 4, 0, 25, 29, 0, 24, 15, 22,
         2, 7, 25, 4, 9, 17, 30, 2, 10, 27, 28, 18, 4, 27, 24, 8,
         21, 5, 10, 22, 5, 11, 21, 27, 24, 24, 12, 31, 5, 21, 24, 16,
         1, 18, 7, 4, 26, 12, 22, 0, 5, 16, 29, 9, 13, 3, 31, 14],
         [16, 14, 12, 15, 7, 17, 10, 20, 14, 25, 18, 19, 6, 11, 8, 25,
         10, 10, 22, 23, 31, 16, 4, 20, 24, 18, 12, 30, 29, 10, 5, 5,
         1, 12, 13, 7, 31, 5, 19, 28, 16, 1, 22, 13, 17, 10, 20, 7,
         18, 24, 10, 4, 27, 14, 28, 20, 20, 2, 7, 30, 29, 1, 3, 24,
         24, 8, 30, 24, 25, 4, 26, 26, 2, 8, 23, 31, 2, 28, 30, 29,
         4, 1],
         [4, 31, 10, 27, 0, 26, 8, 1, 31, 1, 30, 7, 27, 31, 3, 6,
         5, 27, 1, 21, 9, 5, 12, 0, 30, 18, 5, 11, 20, 29, 27, 25,
         25, 4, 15, 29, 18, 22, 16, 5, 8, 17, 29, 12, 2, 16, 17, 1,
         20, 4, 23, 0, 24, 28, 24, 21, 21, 25, 14, 23, 26, 15, 12, 8,
         13, 16, 9, 21, 21, 8, 5, 22, 18, 12, 24, 11, 11, 12, 1, 10,
         17, 17, 21, 15],
         [16, 16, 21, 18, 15, 23, 24, 22, 26, 26, 10, 18, 19, 12, 15, 11,
         12, 14, 10, 9, 25, 12, 30, 23, 19, 29, 13, 27, 8, 13, 9, 24,
         17, 5, 9, 30, 2, 19, 21, 4, 2, 26, 28, 6, 2, 10, 31, 14,
         19, 22, 6, 17, 7, 5, 12, 2, 13, 6, 26, 17, 18, 1, 20, 8,
         5, 23, 30, 18, 25, 1, 24, 7, 29, 10, 5, 29, 3, 6, 1, 30,
         4, 2, 31, 2, 28, 30],
         [25, 6, 29, 4, 19, 3, 29, 10, 4, 10, 24, 12, 7, 13, 19, 15,
         13, 19, 24, 18, 18, 28, 28, 15, 2, 6, 6, 3, 14, 5, 9, 0,
         4, 17, 22, 29, 19, 10, 7, 7, 11, 28, 7, 27, 26, 1, 21, 21,
         27, 24, 0, 14, 10, 23, 16, 0, 17, 22, 5, 21, 28, 20, 0, 27,
         14, 15, 30, 31, 2, 0, 0, 19, 9, 17, 14, 25, 31, 23, 23, 25,
         10, 4, 26, 28, 11, 8, 15, 9],
         [17, 15, 12, 13, 9, 9, 16, 8, 23, 19, 14, 19, 22, 8, 19, 20,
         25, 24, 3, 5, 9, 23, 29, 24, 19, 28, 29, 19, 18, 24, 27, 13,
         22, 12, 9, 4, 1, 21, 3, 10, 27, 9, 10, 19, 31, 12, 25, 5,
         28, 1, 20, 4, 20, 0, 1, 30, 31, 7, 1, 17, 25, 28, 29, 29,
         14, 2, 5, 19, 15, 28, 8, 13, 24, 1, 4, 14, 5, 25, 1, 26,
         6, 1, 14, 24, 8, 28, 0, 2, 10, 0],
         [19, 30, 20, 26, 17, 22, 12, 27, 5, 24, 6, 30, 13, 0, 14, 6,
         23, 19, 25, 27, 22, 5, 1, 22, 26, 23, 28, 19, 9, 1, 1, 27,
         31, 0, 3, 1, 29, 26, 26, 15, 23, 0, 2, 5, 6, 4, 10, 7,
         27, 31, 4, 19, 11, 23, 30, 6, 13, 15, 0, 18, 3, 15, 18, 17,
         14, 19, 19, 13, 31, 14, 7, 16, 28, 11, 26, 7, 18, 4, 23, 11,
         8, 20, 18, 9, 8, 11, 1, 10, 13, 10, 5, 8],
         [9, 30, 5, 1, 9, 3, 0, 30, 9, 22, 2, 21, 11, 9, 7, 10,
         14, 1, 6, 17, 18, 30, 27, 30, 13, 18, 3, 8, 13, 23, 18, 2,
         13, 29, 1, 2, 13, 5, 29, 17, 18, 18, 4, 28, 29, 5, 17, 26,
         18, 11, 3, 14, 22, 10, 20, 22, 10, 15, 28, 21, 29, 25, 23, 29,
         5, 24, 31, 13, 26, 8, 14, 14, 24, 20, 22, 15, 17, 7, 25, 25,
         31, 9, 21, 5, 9, 26, 22, 1, 26, 2, 1, 25, 27, 12],
         [19, 2, 16, 6, 14, 31, 19, 9, 12, 8, 9, 5, 4, 5, 17, 13,
         5, 12, 24, 13, 17, 18, 1, 15, 0, 22, 18, 27, 30, 9, 5, 20,
         8, 27, 23, 22, 24, 5, 1, 27, 12, 17, 13, 22, 21, 16, 5, 30,
         28, 13, 8, 17, 28, 21, 9, 22, 13, 13, 9, 13, 22, 27, 31, 1,
         26, 0, 24, 9, 8, 9, 2, 9, 0, 5, 5, 24, 13, 27, 28, 4,
         9, 1, 13, 3, 22, 31, 25, 17, 27, 25, 29, 29, 29, 17, 19, 22]
      ];

      var locations = new Array(cycleSpinCount);
      for (var i = 0; i != cycleSpinCount; ++i) {
         locations[i] = new Point(
            coordinates[cycleSpinCount - 1][2 * i],
            coordinates[cycleSpinCount - 1][2 * i + 1]
         );
      }

      return locations;
   };

   // Gives alpha threshold coefficients as a function of detail coefficients
   // d, coarse coefficients c, gradient coefficients p, and standard
   // deviation of Gaussian noise s.
   this.alphaThresholds = function(d, c, p, s) {
      var dm = d.matrix();
      var cm = c.matrix();
      var pm = p.matrix();
      var s2 = s * s;

      var rows = dm.rows;
      var cols = dm.cols;
      var r = new Matrix(rows * cols, 3);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var dv = dm.at(row, col);
            var cv = cm.at(row, col);
            var pv = pm.at(row, col);

            var tcs2 = Math.tanh(100 * cv) * cv + s2;

            var t1 = dv;
            var t2 = Math.exp(-dv * dv / (12 * tcs2)) * dv;
            var t3 = pv;

            var elm = row * cols + col;
            r.at(elm, 0, t1);
            r.at(elm, 1, t2);
            r.at(elm, 2, t3);
          }
      }

      return new FrameMatrix(r);
   };

   // Gives beta threshold coefficients as a function of detail coefficients
   // d, coarse coefficients c, gradient coefficients p, and standard
   // deviation of Gaussian noise s.
   this.betaThresholds = function(d, c, p, s) {
      var dm = d.matrix();
      var cm = c.matrix();
      var pm = p.matrix();
      var s2 = s * s;

      var rows = dm.rows;
      var cols = dm.cols;
      var t1 = 0;
      var t2 = 0;
      var t3 = 0;
      var r = new Matrix(3, 1);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var dv = dm.at(row, col);
            var cv = cm.at(row, col);
            var pv = pm.at(row, col);

            var dvm1 = dv - 1;
            var dvm1u2 = dvm1 * dvm1;
            var dvp1 = dv + 1;
            var dvp1u2 = dvp1 * dvp1;
            var cvm1 = cv - 1;
            var cvm1x100 = 100 * cvm1;
            var cvp1 = cv + 1;
            var cvp1x100 = 100 * cvp1;
            var tcm1 = Math.tanh(cvm1x100);
            var tcp1 = Math.tanh(cvp1x100);
            var scm1 = 1 / Math.cosh(cvm1x100);
            var scp1 = 1 / Math.cosh(cvp1x100);
            var tcm1s2 = cvm1 * tcm1 + s2;
            var tcm1s2x12 = 12 * tcm1s2;
            var tcp1s2 = cvp1 * tcp1 + s2;
            var tcp1s2x12 = 12 * tcp1s2;
            var dvm1u2xtcm1s2x12 = dvm1u2 / tcm1s2x12;
            var dvp1u2xtcp1s2x12 = dvp1u2 / tcp1s2x12;
            var edtcm1s2 = Math.exp(-dvm1u2xtcm1s2x12);
            var edtcp1s2 = Math.exp(-dvp1u2xtcp1s2x12);
            var stcm1 = cvm1x100 * scm1 * scm1 + tcm1;
            var stcp1 = cvp1x100 * scp1 * scp1 + tcp1;

            t1 += dv * dv - cv - s2;
            t2 += 0.5 * (
               (
                  (dv + cv) * dvm1 * edtcm1s2 +
                  (dv - cv) * dvp1 * edtcp1s2
               ) -
               s2 * (
                  edtcm1s2 +
                  edtcp1s2 +
                  dvm1u2xtcm1s2x12 * edtcm1s2 * (dvm1 * stcm1 / tcm1s2 - 2) -
                  dvp1u2xtcp1s2x12 * edtcp1s2 * (dvp1 * stcp1 / tcp1s2 + 2)
               )
            );
            t3 += dv * pv;
         }
      }
      r.at(0, 0, t1);
      r.at(1, 0, t2);
      r.at(2, 0, t3);

      return new FrameMatrix(r);
   };

   // Gives alpha threshold coefficients as a function of detail coefficients
   // d, coarse coefficients c, gradient coefficients p, smoothed gradient
   // coefficients q, and standard deviation of Gaussian noise s.
   // Include gradient classifier.
   this.alphaThresholdsIGC = function(d, c, p, q, s) {
      var dm = d.matrix();
      var cm = c.matrix();
      var pm = p.matrix();
      var qm = q.matrix();
      var s2 = s * s;

      var rows = dm.rows;
      var cols = dm.cols;
      var r = new Matrix(rows * cols, 6);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var dv = dm.at(row, col);
            var cv = cm.at(row, col);
            var pv = pm.at(row, col);
            var qv = qm.at(row, col);

            var tcs2 = Math.tanh(100 * cv) * cv + s2;
            var eq = Math.exp(-qv * qv / (12 * tcs2));

            var t1 = dv;
            var t1g = t1 * eq;
            var t2 = Math.exp(-dv * dv / (12 * tcs2)) * dv;
            var t2g = t2 * eq;
            var t3 = pv;
            var t3g = t3 * eq;

            var elm = row * cols + col;
            r.at(elm, 0, t1);
            r.at(elm, 1, t2);
            r.at(elm, 2, t3);
            r.at(elm, 3, t1g);
            r.at(elm, 4, t2g);
            r.at(elm, 5, t3g);
         }
      }

      return new FrameMatrix(r);
   };

   // Gives beta threshold coefficients as a function of detail coefficients
   // d, coarse coefficients c, gradient coefficients p, smoothed gradient
   // coefficients q, and standard deviation of Gaussian noise s.
   // Include gradient classifier.
   this.betaThresholdsIGC = function(d, c, p, q, s) {
      var dm = d.matrix();
      var cm = c.matrix();
      var pm = p.matrix();
      var qm = q.matrix();
      var s2 = s * s;

      var rows = dm.rows;
      var cols = dm.cols;
      var t1 = 0;
      var t1g = 0;
      var t2 = 0;
      var t2g = 0;
      var t3 = 0;
      var t3g = 0;
      var r = new Matrix(6, 1);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var dv = dm.at(row, col);
            var cv = cm.at(row, col);
            var pv = pm.at(row, col);
            var qv = qm.at(row, col);

            var dvm1 = dv - 1;
            var dvm1u2 = dvm1 * dvm1;
            var dvp1 = dv + 1;
            var dvp1u2 = dvp1 * dvp1;
            var cvm1 = cv - 1;
            var cvm1x100 = 100 * cvm1;
            var cvp1 = cv + 1;
            var cvp1x100 = 100 * cvp1;
            var qvu2 = qv * qv;
            var tcm1 = Math.tanh(cvm1x100);
            var tcp1 = Math.tanh(cvp1x100);
            var scm1 = 1 / Math.cosh(cvm1x100);
            var scp1 = 1 / Math.cosh(cvp1x100);
            var tcm1s2 = cvm1 * tcm1 + s2;
            var tcm1s2x12 = 12 * tcm1s2;
            var tcp1s2 = cvp1 * tcp1 + s2;
            var tcp1s2x12 = 12 * tcp1s2;
            var dvm1u2xtcm1s2x12 = dvm1u2 / tcm1s2x12;
            var dvp1u2xtcp1s2x12 = dvp1u2 / tcp1s2x12;
            var qvu2xtcm1s2x12 = qvu2 / tcm1s2x12;
            var qvu2xtcp1s2x12 = qvu2 / tcp1s2x12;
            var edtcm1s2 = Math.exp(-dvm1u2xtcm1s2x12);
            var edtcp1s2 = Math.exp(-dvp1u2xtcp1s2x12);
            var eqtcm1s2 = Math.exp(-qvu2xtcm1s2x12);
            var eqtcp1s2 = Math.exp(-qvu2xtcp1s2x12);
            var eqdtcm1s2 = eqtcm1s2 * edtcm1s2;
            var eqdtcp1s2 = eqtcp1s2 * edtcp1s2;
            var stcm1 = cvm1x100 * scm1 * scm1 + tcm1;
            var stcp1 = cvp1x100 * scp1 * scp1 + tcp1;

            t1 += dv * dv - cv - s2;
            t1g += 0.5 * (
               (
                  (dv + cv) * dvm1 * eqtcm1s2 +
                  (dv - cv) * dvp1 * eqtcp1s2
               ) -
               s2 * (
                  eqtcm1s2 +
                  eqtcp1s2 +
                  qvu2xtcm1s2x12 * eqtcm1s2 * (dvm1 * stcm1 / tcm1s2) -
                  qvu2xtcp1s2x12 * eqtcp1s2 * (dvp1 * stcp1 / tcp1s2)
               )
            );
            t2 += 0.5 * (
               (
                  (dv + cv) * dvm1 * edtcm1s2 +
                  (dv - cv) * dvp1 * edtcp1s2
               ) -
               s2 * (
                  edtcm1s2 +
                  edtcp1s2 +
                  dvm1u2xtcm1s2x12 * edtcm1s2 * (dvm1 * stcm1 / tcm1s2 - 2) -
                  dvp1u2xtcp1s2x12 * edtcp1s2 * (dvp1 * stcp1 / tcp1s2 + 2)
               )
            );
            t2g += 0.5 * (
               (
                  (dv + cv) * dvm1 * eqdtcm1s2 +
                  (dv - cv) * dvp1 * eqdtcp1s2
               ) -
               s2 * (
                  eqdtcm1s2 +
                  eqdtcp1s2 +
                  eqdtcm1s2 * (
                     dvm1 * stcm1 / tcm1s2 * (dvm1u2xtcm1s2x12 + qvu2xtcm1s2x12) -
                     2 * dvm1u2xtcm1s2x12
                  ) -
                  eqdtcp1s2 * (
                     dvp1 * stcp1 / tcp1s2 * (dvp1u2xtcp1s2x12 + qvu2xtcp1s2x12) +
                     2 * dvp1u2xtcp1s2x12
                  )
               )
            );
            t3 += dv * pv;
            t3g += 0.5 * pv * (
               (
                  (dv + cv) * eqtcm1s2 +
                  (dv - cv) * eqtcp1s2
               ) -
               s2 * (
                  qvu2xtcm1s2x12 * eqtcm1s2 * (stcm1 / tcm1s2) -
                  qvu2xtcp1s2x12 * eqtcp1s2 * (stcp1 / tcp1s2)
               )
            );
         }
      }
      r.at(0, 0, t1);
      r.at(1, 0, t2);
      r.at(2, 0, t3);
      r.at(3, 0, t1g);
      r.at(4, 0, t2g);
      r.at(5, 0, t3g);

      return new FrameMatrix(r);
   };

   // Gives the threshold gradient as a function of coarse coefficients c,
   // smoothed gradient q, and standard deviation of Gaussian noise s.
   this.thresholdGradient = function(c, q, s) {
      var cm = c.matrix();
      var qm = q.matrix();
      var s2 = s * s;

      var rows = cm.rows;
      var cols = cm.cols;
      var r = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var cv = cm.at(row, col);
            var qv = qm.at(row, col);

            var tcs2 = Math.tanh(100 * cv) * cv + s2;
            var eq = Math.exp(-qv * qv / (12 * tcs2));

            r.at(row, col, eq);
         }
      }

      return new FrameMatrix(r);
   }

   // Logs weight information.
   this.logWeight = function(level, vw, hw, dw) {
      console.writeln(format("weight%d = {", level));
      console.writeln(format("{\"level\", %d},", level));

      console.write(format("{\"vw\", "));
      for (var row = 0; row != vw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            vw.matrix().at(row, 0), row == vw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.write(format("{\"hw\", "));
      for (var row = 0; row != hw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            hw.matrix().at(row, 0), row == hw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.write(format("{\"dw\", "));
      for (var row = 0; row != dw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            dw.matrix().at(row, 0), row == dw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("}"));

      console.writeln(format("};"));
      console.flush();
   };

   // Logs scale information.
   this.logScale = function(
      levelsOfRefinement,
      level,
      locations,
      vw, hw, dw,
      c1, v1, h1, d1,
      c2, v2, h2, d2,
      vp, hp, dp,
      vq, hq, dq,
      gaussianNoise
   ) {
      console.writeln(format("scale%d = {", level));
      console.writeln(format("{\"image\", \"%s\"},", model.imageView.fullId));
      console.writeln(format("{\"level\", %d},", level));

      console.write(format("{\"vw\", "));
      for (var row = 0; row != vw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            vw.matrix().at(row, 0), row == vw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.write(format("{\"hw\", "));
      for (var row = 0; row != hw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            hw.matrix().at(row, 0), row == hw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.write(format("{\"dw\", "));
      for (var row = 0; row != dw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            dw.matrix().at(row, 0), row == dw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.writeln(format("{"));
      for (var i = 0; i != locations.length; ++i) {
         var row0 = locations[i].y;
         var col0 = locations[i].x;
         var row = Math.floor(locations[i].y / Math.round(Math.pow2(level)));
         var col = Math.floor(locations[i].x / Math.round(Math.pow2(level)));
         console.writeln(format("{"));

         console.writeln(format("{\"location\", %d, %d},", col0, row0));
         console.writeln(format("{\"position\", %d, %d},", col, row));

         var c1p = c1.matrix().at(row, col);
         var v1p = v1.matrix().at(row, col);
         var h1p = h1.matrix().at(row, col);
         var d1p = d1.matrix().at(row, col);
         console.writeln(format(
            "{\"c1_v1_h1_d1\", %.3f, %.3f, %.3f, %.3f},", c1p, v1p, h1p, d1p
         ).replace(/e/g, "*^"));

         var c2p = c2.matrix().at(row, col);
         var v2p = v2.matrix().at(row, col);
         var h2p = h2.matrix().at(row, col);
         var d2p = d2.matrix().at(row, col);
         console.writeln(format(
            "{\"c2_v2_h2_d2\", %.3f, %.3f, %.3f, %.3f},", c2p, v2p, h2p, d2p
         ).replace(/e/g, "*^"));

         var vpp = vp.matrix().at(row, col);
         var hpp = hp.matrix().at(row, col);
         var dpp = dp.matrix().at(row, col);
         console.writeln(format(
            "{\"vp_hp_dp\", %.3f, %.3f, %.3f},", vpp, hpp, dpp
         ).replace(/e/g, "*^"));

         var vqp = vq.matrix().at(row, col);
         var hqp = hq.matrix().at(row, col);
         var dqp = dq.matrix().at(row, col);
         console.writeln(format(
            "{\"vq_hq_dq\", %.3f, %.3f, %.3f},", vqp, hqp, dqp
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"noisE\", %.3f},", gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"v1_c1_vp_vq_noisE\", %.3f, %.3f, %.3f, %.3f, %.3f},",
            v1p, c1p, vpp, vqp, gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"h1_c1_hp_hq_noisE\", %.3f, %.3f, %.3f, %.3f, %.3f},",
            h1p, c1p, hpp, hqp, gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"d1_c1_dp_dq_noisE\", %.3f, %.3f, %.3f, %.3f, %.3f}",
            d1p, c1p, dpp, dqp, gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format("}%s", i == locations.length - 1 ? "" : ", "));
      }
      console.writeln(format("}"));

      console.writeln(format("};"));
      console.flush();
   };

   // Denoises the image.
   this.denoiseImage = function(
      image,
      gaussianNoise,
      levelsOfRefinement,
      level,
      locations
   ) {
      var imageDecompose = image.unnormalizedHaarDecompose();
      view.throwAbort();

      var s = imageDecompose[0];
      var c1 = imageDecompose[1];
      var v1 = imageDecompose[2];
      var h1 = imageDecompose[3];
      var d1 = imageDecompose[4];
      view.throwAbort();

      {
         var vp = c1.centeredGradientColumns();
         var hp = c1.centeredGradientRows();
         var dp = hp.centeredGradientColumns();
         view.throwAbort();
      }

      if (!model.includeGradientClassifier) {
         var vq = vp.clone();
         var hq = hp.clone();
         var dq = dp.clone();
         view.throwAbort();
      } else {
         // GaussianMatrix[{{1}}, Method -> "Bessel"]
         var kernel = [0.0993805, 0.801239, 0.0993805];

         var vq = vp.absoluteValue().pipeline([
            function(frame) {
               return frame.filterRowsColumnsApproximate(kernel);
            }
         ]);
         var hq = hp.absoluteValue().pipeline([
            function(frame) {
               return frame.filterRowsColumnsApproximate(kernel);
            }
         ]);
         var dq = dp.absoluteValue().pipeline([
            function(frame) {
               return frame.filterRowsColumnsApproximate(kernel);
            }
         ]);
         view.throwAbort();

         if (false) {
            this.thresholdGradient(c1, vq, 2 * gaussianNoise).toImageWindow(
               format("vq_%d", level)
            ).show();
            this.thresholdGradient(c1, hq, 2 * gaussianNoise).toImageWindow(
               format("hq_%d", level)
            ).show();
            this.thresholdGradient(c1, dq, 2 * gaussianNoise).toImageWindow(
               format("dq_%d", level)
            ).show();
         }
      }

      if (!model.includeGradientClassifier) {
         var vat = this.alphaThresholds(v1, c1, vp, 2 * gaussianNoise);
         var hat = this.alphaThresholds(h1, c1, hp, 2 * gaussianNoise);
         var dat = this.alphaThresholds(d1, c1, dp, 2 * gaussianNoise);
         view.throwAbort();

         var vbt = this.betaThresholds(v1, c1, vp, 2 * gaussianNoise);
         var hbt = this.betaThresholds(h1, c1, hp, 2 * gaussianNoise);
         var dbt = this.betaThresholds(d1, c1, dp, 2 * gaussianNoise);
         view.throwAbort();
      } else {
         var vat = this.alphaThresholdsIGC(v1, c1, vp, vq, 2 * gaussianNoise);
         var hat = this.alphaThresholdsIGC(h1, c1, hp, hq, 2 * gaussianNoise);
         var dat = this.alphaThresholdsIGC(d1, c1, dp, dq, 2 * gaussianNoise);
         view.throwAbort();

         var vbt = this.betaThresholdsIGC(v1, c1, vp, vq, 2 * gaussianNoise);
         var hbt = this.betaThresholdsIGC(h1, c1, hp, hq, 2 * gaussianNoise);
         var dbt = this.betaThresholdsIGC(d1, c1, dp, dq, 2 * gaussianNoise);
         view.throwAbort();
      }

      {
         var vatt = vat.transpose();
         var hatt = hat.transpose();
         var datt = dat.transpose();
         view.throwAbort();

         var vtm = vatt.productFrame(vat);
         var htm = hatt.productFrame(hat);
         var dtm = datt.productFrame(dat);
         view.throwAbort();

         vatt.clear();
         hatt.clear();
         datt.clear();
      }

      if (model.includeSpacialClassifier) {
         var thresholdScale = Math.pow2(20);

         var vtmi = vtm.pseudoInverse(thresholdScale).pseudoInverse;
         var htmi = htm.pseudoInverse(thresholdScale).pseudoInverse;
         var dtmi = dtm.pseudoInverse(thresholdScale).pseudoInverse;
         view.throwAbort();

         vtm.clear();
         htm.clear();
         dtm.clear();

         var vw = vtmi.productFrame(vbt);
         var hw = htmi.productFrame(hbt);
         var dw = dtmi.productFrame(dbt);
         view.throwAbort();

         vtmi.clear();
         htmi.clear();
         dtmi.clear();

         vbt.clear();
         hbt.clear();
         dbt.clear();
      }
      else {
         var thresholdScale = Math.pow2(20);

         var tm = vtm.clone().pipeline([
            function(frame) {
               return frame.addFrame(htm);
            },
            function(frame) {
               return frame.addFrame(dtm);
            }
         ]);
         var tmi = tm.pseudoInverse(thresholdScale).pseudoInverse;
         view.throwAbort();

         vtm.clear();
         htm.clear();
         dtm.clear();
         tm.clear();

         var bt = vbt.clone().pipeline([
            function(frame) {
               return frame.addFrame(hbt);
            },
            function(frame) {
               return frame.addFrame(dbt);
            }
         ]);
         var w = tmi.productFrame(bt);
         var vw = w.clone();
         var hw = w.clone();
         var dw = w.clone();
         view.throwAbort();

         w.clear();

         vbt.clear();
         hbt.clear();
         dbt.clear();
         bt.clear();
      }

      if (false) {
         this.logWeight(level, vw, hw, dw);
      }

      {
         var v2m = vat.productFrame(vw);
         var h2m = hat.productFrame(hw);
         var d2m = dat.productFrame(dw);
         view.throwAbort();

         vat.clear();
         hat.clear();
         dat.clear();

         var v2 = v2m.reshape(v1.matrix().rows, v1.matrix().cols);
         var h2 = h2m.reshape(h1.matrix().rows, h1.matrix().cols);
         var d2 = d2m.reshape(d1.matrix().rows, d1.matrix().cols);
         view.throwAbort();

         v2m.clear();
         h2m.clear();
         d2m.clear();
      }

      {
         if (level == levelsOfRefinement) {
            var c2 = c1.clone();
         }
         else {
            var ratio = 1 / model.subbandVarianceScalingRatio(level);
            var c1r = c1.multiplyScalar(ratio);

            var c2r = this.denoiseImage(
               c1r,
               2 * Math.sqrt(ratio) * gaussianNoise,
               levelsOfRefinement,
               level + 1,
               locations
            );
            c1r.clear();

            var c2 = c2r.multiplyScalar(1 / ratio);
            c2r.clear();
         }
         view.throwAbort();

         var reconstruct = s.unnormalizedHaarReconstruct([s, c2, v2, h2, d2]);
         view.throwAbort();

         if (locations.length != 0) {
            this.logScale(
               levelsOfRefinement,
               level,
               locations,
               vw, hw, dw,
               c1, v1, h1, d1,
               c2, v2, h2, d2,
               vp, hp, dp,
               vq, hq, dq,
               2 * gaussianNoise
            );
         }

         vw.clear();
         hw.clear();
         dw.clear();

         c1.clear();
         v1.clear();
         h1.clear();
         d1.clear();

         vq.clear();
         hq.clear();
         dq.clear();

         vp.clear();
         hp.clear();
         dp.clear();

         c2.clear();
         v2.clear();
         h2.clear();
         d2.clear();

         s.clear();
      }

      return reconstruct;
   };

   // Performs one cycle-spin of denoising.
   this.denoiseCycleSpin = function(
      flatfield, cycleSpinLocation, levelsOfRefinement
   ) {
      var baseGain = model.baseGain();
      var baseGaussianNoise = model.baseGaussianNoise();
      var baseOffset = model.baseOffset();
      var pad = 2 * Math.round(Math.pow2(levelsOfRefinement));

      var self = this;
      var image = (
         new FrameMatrix(model.imageView.image.toMatrix())
      ).pipeline([
         !model.usingMetadataTransform ||
         (model.metadataTransform[0] == 0 && model.metadataTransform[1] == 1) ? null :
            function(frame) {
               return frame.fusedAddMultiplyScalar(
                  -model.metadataTransform[0], 1 / model.metadataTransform[1]
               );
            },
         function(frame) {
            return frame.fusedMultiplyAddScalar(
               65535 * baseGain, -baseOffset
            );
         },
         flatfield == null ? null :
            function(frame) {
               return frame.multiplyFrame(flatfield);
            },
         function(frame) {
            return frame.fusedPadShift(
               pad, cycleSpinLocation.x, cycleSpinLocation.y
            );
         },

         function(frame) {
            view.throwAbort();
            return self.denoiseImage(
               frame,
               baseGaussianNoise,
               levelsOfRefinement,
               1,
               self.padShiftLogLocations(
                  self.logLocations,
                  pad,
                  cycleSpinLocation.x,
                  cycleSpinLocation.y
               )
           );
         },

         function(frame) {
            return frame.fusedShiftPad(
               -cycleSpinLocation.x, -cycleSpinLocation.y, -pad
            );
         },
         flatfield == null ? null :
            function(frame) {
               return frame.divideFrame(flatfield);
            },
         function(frame) {
            return frame.fusedAddMultiplyScalar(
               baseOffset, 1 / (65535 * baseGain)
            );
         },
         !model.usingMetadataTransform ||
         (model.metadataTransform[0] == 0 && model.metadataTransform[1] == 1) ? null :
            function(frame) {
               return frame.fusedMultiplyAddScalar(
                  model.metadataTransform[1], model.metadataTransform[0]
               );
            }
      ]);

      if (!image.isFinite()) {
         throw new Error(
            "The denoise process did not find a representable result."
         );
      }

      return image;
   };

   // Generates the smooth flatfield.
   this.generateSmoothFlatfield = function() {
      var flatfield = null;
      if (model.flatfieldView != null && model.flatfieldView.isView) {

         flatfield =
            (new FrameMatrix(model.flatfieldView.image.toMatrix())).pipeline([
               function(frame) {
                  var tiny = 1.0e-15;

                  return frame.maxScalar(tiny);
               }
            ]);
         var image = flatfield.matrix().toImage();
         flatfield.clear();

         var layers = [];
         for (
            var layer = 0;
            layer != model.smoothFlatfieldLayerCount + 1;
            ++layer
         ) {
            layers.push([
               layer == model.smoothFlatfieldLayerCount,
               true, 0.000, false, 3.000, 1.00, 1
            ]);
         }

         var MLT = new MultiscaleLinearTransform;
         MLT.layers = layers;
         MLT.transform =
            MultiscaleLinearTransform.prototype.MultiscaleLinearTransform;
         MLT.executeOn(image);
         Console.abortEnabled = view.consoleAbortEnabled();

         var self = this;
         flatfield = (new FrameMatrix(image.toMatrix())).pipeline([
            function(frame) {
               return self.logSmoothFlatfieldScale(
                  frame.multiplyScalar(1 / frame.matrix().mean())
               );
            },
            model.imageView.isMainView ? null :
               function(frame) {
                  return frame.crop(
                     model.imageView.window.previewRect(model.imageView)
                  );
               }
         ]);

         image.free();
      }

      return flatfield;
   };

   // Logs the smooth flatfield scale.
   this.logSmoothFlatfieldScale = function(flatfield) {
      var flatfieldStdDev = flatfield.matrix().stdDev();
      console.writeln(format(
         "Flatfield scale: " + model.flatfieldScaleFormat +
         " " + model.flatfieldScaleUnits,
         model.flatfieldScaleNormalization *
         (isFinite(flatfieldStdDev) ? flatfieldStdDev : 0)
      ));
      console.flush();

      return flatfield;
   };

   // Logs the base parameters.
   this.logBaseParameters = function() {
      var baseGain = model.baseGain();
      console.writeln(format(
         "Base gain: " + model.detectorGainFormat +
         " " + model.detectorGainUnits,
         baseGain
      ));

      var baseGaussianNoise = model.baseGaussianNoise();
      console.writeln(format(
         "Base Gaussian noise: " + model.detectorGaussianNoiseFormat +
         " " + "e-",
         baseGaussianNoise
      ));

      var baseOffset = model.baseOffset();
      console.writeln(format(
         "Base offset: " + model.detectorOffsetFormat +
         " " + "e-",
         baseOffset
      ));

      console.flush();
   };

   // Generates the method noise image.
   this.generateMethodNoiseImage = function(estimate) {
      return (
         new FrameMatrix(model.imageView.image.toMatrix())
      ).pipeline([
         function(frame) {
            return frame.subtractFrame(estimate);
         },
         function(frame) {
            return frame.addScalar(0.5);
         },
         function(frame) {
            return frame.truncate(0, 1);
         }
      ]);
   };

   // Gives a display function as a function of midtone, shadow, and highlight.
   this.generateDisplayFunction = function(midtone, shadow, highlight) {
      return [
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1]
      ];
   };

   // Generates the method noise image window.
   this.generateMethodNoiseImageWindow = function(methodNoise) {
      var imageWindow =
         methodNoise.toImageWindow(model.imageView.fullId + "_method_noise");

      var quantiles = methodNoise.histogramQuantiles(
         model.generateMethodNoiseImageQuantileResolution,
         model.generateMethodNoiseImageQuantileLow,
         model.generateMethodNoiseImageQuantileHigh
      );
      imageWindow.mainView.stf = this.generateDisplayFunction(
         0.5, quantiles[0], quantiles[1]
      );

      imageWindow.show();

      return imageWindow;
   };

   // Logs the method noise.
   this.logMethodNoise = function(methodNoise) {
      var methodNoiseStdDev = methodNoise.matrix().stdDev();
      console.writeln(format(
         "Method noise: " + model.detectorGaussianNoiseFormat +
         " " + model.detectorGaussianNoiseUnits,
         65535 * methodNoiseStdDev
      ));
      console.flush();
   };

   // Generates the exposure estimate.
   this.generateExposureEstimate = function(flatfield, quantile) {
      var image = (
         new FrameMatrix(model.imageView.image.toMatrix())
      ).pipeline([
         flatfield == null ? null :
            function(frame) {
               return frame.multiplyFrame(flatfield);
            }
      ]);

      var matrix = image.matrix();
      var size = model.varianceEstimateBlockSize;
      var rows = Math.floor(matrix.rows / size);
      var rowOffset = Math.floor(0.5 * (matrix.rows - size * rows));
      var cols = Math.floor(matrix.cols / size);
      var colOffset = Math.floor(0.5 * (matrix.cols - size * cols));
      var blocks = new Vector(0, rows * cols);
      var block = new Vector(0, size * size);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            for (var brow = 0; brow != size; ++brow) {
               for (var bcol = 0; bcol != size; ++bcol) {
                  block.at(
                     size * brow + bcol,
                     matrix.at(
                        size * row + rowOffset + brow,
                        size * col + colOffset + bcol
                     )
                  );
               }
            }
            blocks.at(cols * row + col, block.median());
         }
      }
      blocks.sort();

      var exposure = 65535 * blocks.at(
         Math.round(quantile * (blocks.length - 1))
      );

      block.assign(0, 0);
      blocks.assign(0, 0);
      image.clear();

      return exposure;
   };

   // Generates the variance estimate.
   this.generateVarianceEstimate = function(flatfield, quantile) {
      var poissonNoise =
         Math.max(0, (
            this.generateExposureEstimate(flatfield, quantile) -
            model.detectorOffset
         )) /
         (model.imageCombinationCount * model.detectorGain);
      var gaussianNoise =
         model.detectorGaussianNoise * model.detectorGaussianNoise /
         model.imageCombinationCount;
      var totalNoise = poissonNoise + gaussianNoise;

      return {
         quantile: quantile,
         poissonNoise: poissonNoise / totalNoise,
         gaussianNoise: gaussianNoise / totalNoise
      };
   };

   // Logs the variance estimate.
   this.logVarianceEstimate = function(varianceEstimate) {
      console.writeln(format(
         model.varianceEstimateQuantileFormat +
            " percentile exposure Poisson noise variance: " +
            model.varianceEstimateFormat + " " + model.varianceEstimateUnits,
         Math.round(
            model.varianceEstimateNormalization *
            varianceEstimate.quantile
         ),
         model.varianceEstimateNormalization *
            varianceEstimate.poissonNoise
      ));
      console.writeln(format(
         model.varianceEstimateQuantileFormat +
            " percentile exposure Gaussian noise variance: " +
            model.varianceEstimateFormat + " " + model.varianceEstimateUnits,
         Math.round(
            model.varianceEstimateNormalization *
            varianceEstimate.quantile
         ),
         model.varianceEstimateNormalization *
            varianceEstimate.gaussianNoise
      ));
      console.flush();
   };

   // Assigns the estimate.
   this.assignEstimate = function(estimate) {
      var estimateImage = estimate.matrix().toImage();
      model.imageView.image.assign(estimateImage);
      estimateImage.free();
   };

   // Denoises the image.
   this.denoise = function() {
      var assigned = false;
      model.imageView.beginProcess();
      try {
         if (model.flatfieldView != null && model.flatfieldView.isView) {
            console.writeln();
            console.writeln(format(
               "<b>Smooth:</b> Processing view: " + model.flatfieldViewFormat,
               model.flatfieldView.fullId
            ));
            console.flush();
         }

         var flatfield = this.generateSmoothFlatfield();

         console.writeln();
         console.writeln(format(
            "<b>Denoise:</b> Processing view: " + model.imageViewFormat,
            model.imageView.fullId
         ));
         console.flush();

         // this.logBaseParameters();

         var levelsOfRefinement = this.generateLevelsOfRefinement();
         var cycleSpinCount = model.denoiseCycleSpinCount;
         var cycleSpinLocations = this.generateCycleSpinLocations(cycleSpinCount);
         if (this.logLocations.length != 0) {
            cycleSpinLocations = [new Point(0, 0)];
         }

         var estimate = new FrameMatrix(new Matrix(
            0, model.imageView.image.height, model.imageView.image.width
         ));

         for (var i = 0; i != cycleSpinLocations.length; ++i) {
            console.writeln(format(
               "Cycle-spin: " + model.denoiseCycleSpinCountFormat,
               i + 1
            ));
            console.flush();

            var addition = this.denoiseCycleSpin(
               flatfield, cycleSpinLocations[i], levelsOfRefinement
            );
            estimate = estimate.pipeline([
               function(frame) {
                  return frame.addFrame(addition);
               }
            ]);
            addition.clear();
            view.throwAbort();
         }

         estimate = estimate.pipeline([
            function(frame) {
               return frame.multiplyScalar(1 / cycleSpinLocations.length);
            },
            function(frame) {
               return frame.truncate(0, 1);
            }
         ]);

         if (!estimate.isFinite()) {
            throw new Error(
               "The denoise process did not find a representable result."
            );
         }

         if (model.generateMethodNoiseImage) {
            var self = this;
            (this.generateMethodNoiseImage(estimate)).pipeline([
               function(frame) {
                  self.logMethodNoise(frame);

                  var varianceEstimate = self.generateVarianceEstimate(
                     flatfield, model.varianceEstimateQuantile
                  );

                  self.logVarianceEstimate(varianceEstimate);

                  return self.generateMethodNoiseImageWindow(frame);
               }
            ]);
         }

         this.assignEstimate(estimate);
         assigned = true;
         estimate.clear();

         if (flatfield != null) {
            flatfield.clear();
         }
      }
      finally {
         if (assigned) {
            model.imageView.endProcess();
         } else {
            model.imageView.cancelProcess();
         }
         // console.writeln("globalFrameMatrixCount: ", globalFrameMatrixCount);
      }
   };
};

// ****************************************************************************
// EOF MureEstimator.js - Released 2020/01/21 00:00:00 UTC
