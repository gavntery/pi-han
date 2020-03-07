// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// INDI-helper.jsh - Released 2020-01-22T17:07:33Z
// ----------------------------------------------------------------------------
//
//
// Copyright (c) 2003-2020 Pleiades Astrophoto S.L. All Rights Reserved.
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

/* beautify ignore:start */
#ifndef _INDI_helper_jsh
#define _INDI_helper_jsh

#include <pjsr/DataType.jsh>
/* beautify ignore:end */

/*
 * Loads all FITS keywords from the first HDU of the specified FITS file and
 * returns them as an array.
 */
if ( !File.loadFITSKeywordArray )
   File.loadFITSKeywordArray = function( filePath )
   {
      function searchCommentSeparator( b )
      {
         let inString = false;
         for ( let i = 9; i < 80; ++i )
            switch ( b.at( i ) )
            {
               case 39: // single quote
                  inString ^= true;
                  break;
               case 47: // slash
                  if ( !inString )
                     return i;
                  break;
            }
         return -1;
      }

      let f = File.openFileForReading( filePath );
      let keywords = new Array;
      for ( ;; )
      {
         let rawData = f.read( DataType_ByteArray, 80 );
         let name = rawData.toString( 0, 8 );
         if ( name.toUpperCase() == "END     " ) // end of HDU keyword list?
            break;

         if ( f.isEOF )
            throw new Error( "Unexpected end of file: " + filePath );

         let value;
         let comment;
         if ( rawData.at( 8 ) == 61 ) // value separator (an equal sign at byte 8) present?
         {
            // This is a valued keyword
            let cmtPos = searchCommentSeparator( rawData ); // find comment separator slash
            if ( cmtPos < 0 ) // no comment separator?
               cmtPos = 80;
            value = rawData.toString( 9, cmtPos - 9 ); // value substring
            if ( cmtPos < 80 )
               comment = rawData.toString( cmtPos + 1, 80 - cmtPos - 1 ); // comment substring
            else
               comment = new String;
         }
         else
         {
            // No value in this keyword
            value = new String;
            comment = rawData.toString( 8, 80 - 8 );
         }

         // Perform a naive sanity check: a valid FITS file must begin with a SIMPLE=T keyword.
         if ( keywords.length == 0 )
            if ( name != "SIMPLE  " && value.trim() != 'T' )
               throw new Error( "File does not seem a valid FITS file: " + filePath );

         // Add new keyword. Note: use FITSKeyword with PI >= 1.6.1
         keywords.push(
         {
            name: name.trim(),
            value: value.trim(),
            comment: comment.trim()
         } );
      }
      f.close();
      return keywords;
   };


function indexOfFITSKeyword( keywords, name )
{
   for ( let index in keywords )
      if ( keywords[ index ].name === name )
         return index;
   return -1;
}

function indexOfDevice( devices, name )
{
   for ( let index in devices )
      if ( devices[ index ][ 0 ] === name )
         return index;
   return -1;
}

function propertyEquals( propertyTable, propertyKey, value )
{
   for ( let index in propertyTable )
      if ( propertyTable[ index ][ 0 ] === propertyKey )
         if ( propertyTable[ index ][ 1 ] === value )
            return true;
   return false;
}

/* beautify ignore:start */
#endif   //_INDI_helper_jsh
/* beautify ignore:end */

// ----------------------------------------------------------------------------
// EOF INDI-helper.jsh - Released 2020-01-22T17:07:33Z
