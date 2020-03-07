//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/Test.jsh - Released 2019-04-29T18:55:31Z
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

#ifndef __PJSR_Test_jsh
#define __PJSR_Test_jsh

function Test( name, parent )
{
   this.__base__ = Object;
   this.__base__();

   this.name = name;
   this.parent = parent ? parent : undefined;
   this.children = [];
   this.succeeded = 0;
   this.failed = 0;

   this.begin = function()
   {
   };

   this.end = function()
   {
   };

   this.add = function( test )
   {
      this.children.push( test );
   };

   this.run = function()
   {
      this.total = this.succeeded = this.failed = 0;
      this.begin();

      if ( this.parent )
      {
         Test.log( "----------------------------------------------------------------" );
         Test.log( "Test: " + this.name );
         Test.log( "----------------------------------------------------------------" );

         for ( let i = 0; i < this.children.length; ++i )
         {
            try
            {
               this.children[i].call();
               Test.log( "PASSED: Test case " + this.children[i].name );
               ++this.succeeded;
            }
            catch ( err )
            {
               Test.log( "FAILED: Test case " + this.children[i].name + " --- " + err );
               console.criticalln( err.stack );
               ++this.failed;
            }
            finally
            {
            }
            ++this.total;
         }

         if ( this.failed )
         {
            Test.log( "FAILURE" );
            Test.log( this.failed + "/" + this.total + " tests failed." );
         }
         else
         {
            Test.log( "SUCCESS" );
            Test.log( this.succeeded + "/" + this.total + " tests successfully passed." );
         }

         Test.log( "----------------------------------------------------------------" );
      }
      else
      {
         Test.clearLog();

         Test.log( "================================================================" );
         Test.log( "Test Suite: " + this.name );
         Test.log( "================================================================" );

         for ( let i = 0; i < this.children.length; ++i )
         {
            Test.log( "" );
            this.children[i].run();
            if ( this.children[i].failed )
               ++this.failed;
            else
               ++this.succeeded;
            ++this.total;
            Test.log( "" );
         }

         Test.log( "================================================================" );

         console.writeln( "<end><cbr><br>", Test.logText() );
      }

      this.end();
   };
}

Test.prototype = new Object;

Test.logLines = new Array;

Test.log = function( line )
{
   Test.logLines.push( line );
};

Test.clearLog = function()
{
   Test.logLines = new Array;
};

Test.logText = function()
{
   let text = "";
   for ( let i = 0; i < Test.logLines.length; ++i )
      text += Test.logLines[i] + '\n';
   return text;
};

#endif   // __PJSR_Test_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/Test.jsh - Released 2019-04-29T18:55:31Z
