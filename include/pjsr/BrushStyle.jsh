//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/BrushStyle.jsh - Released 2019-04-29T18:55:31Z
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2019 Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_BrushStyle_jsh
#define __PJSR_BrushStyle_jsh

/*
 * Brush styles
 */
#define BrushStyle_Empty                  0  // empty brush (no fill)
#define BrushStyle_Solid                  1  // solid pattern brush
#define BrushStyle_Dense                  2  // dense pattern brush
#define BrushStyle_HalfTone               3  // 50% pattern brush
#define BrushStyle_Sparse                 4  // sparse pattern brush
#define BrushStyle_HorizontalHatch        5  // -----
#define BrushStyle_VerticalHatch          6  // |||||
#define BrushStyle_CrossHatch             7  // +++++
#define BrushStyle_ForwardDiagonalHatch   8  // /////
#define BrushStyle_BackwardDiagonalHatch  9  // \\\\\. <--- why this dot? :)
#define BrushStyle_CrossDiagonalHatch    10  // XXXXX
#define BrushStyle_Stipple               11  // fill with a tiled Bitmap
#define BrushStyle_LinearGradient        12  // fill with a linear gradient
#define BrushStyle_RadialGradient        13  // fill with a radial gradient
#define BrushStyle_ConicalGradient       14  // fill with a conical gradient

#endif   // __PJSR_BrushStyle_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/BrushStyle.jsh - Released 2019-04-29T18:55:31Z
