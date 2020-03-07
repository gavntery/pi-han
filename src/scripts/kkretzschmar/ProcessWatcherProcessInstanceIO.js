// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// ProcessWatcherProcessInstanceIO.js - Released 2020-01-22T17:07:33Z
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

function ProcessInstanceIO( processIcon )
{
   this.__base__ = Object;
   this.__base__();
   this.processInstance = ProcessInstance.fromIcon( processIcon );

   this.getProcessId = function()
   {
      return this.processInstance.processId();
   };

   this.addInputFrames = function( files )
   {
      let frames = this.getInputFrames();
      for ( let i = 0; i < files.length; ++i )
      {
         let doContinue = false;
         for ( let j = 0; j < frames.length; j++ )
            if ( this.getInputFile( frames, j ) == files[ i ].name && !this.isInputFileEnabled( frames, j ) )
               doContinue = true;
         if ( doContinue )
            continue;
         this.addNewFile( frames, files[ i ].name )
      }
      this.setInputFrames( frames );
   };

   this.execute = function()
   {
      let frames = this.getInputFrames();
      let doExecute = false;
      for ( let i = 0; i < frames.length; i++ )
         if ( this.isInputFileEnabled( frames, i ) )
            doExecute = true;
      if ( doExecute )
         this.processInstance.executeGlobal();
      return doExecute;
   };

   this.disableFrames = function()
   {
      let frames = this.getInputFrames();
      for ( let frameItemIdx = 0; frameItemIdx < frames.length; frameItemIdx++ )
         frames[ frameItemIdx ][ 0 ] = false;
      this.setInputFrames( frames );
   };

   // methods that should be overwritten by child-classes
   this.setInputFrames = function( inputFilesArray ) {};

   this.getInputFrames = function()
   {
      return [
         [ false, "" ]
      ];
   };

   this.getInputFile = function( frames, index )
   {
      return frames[ index ][ 1 ];
   };

   this.isInputFileEnabled = function( frames, index )
   {
      return frames[ index ][ 0 ];
   };

   this.addNewFile = function( frames, file )
   {
      frames.push( [ true, file ] );
   };

   this.setOutputDirectory = function( outputDirectory )
   {
      this.processInstance.outputDirectory = outputDirectory;
   };

   this.getOutputDirectory = function()
   {
      return this.processInstance.outputDirectory;
   };

   this.createsMeasurements = function()
   {
      return false;
   };

   this.getMeasurements = function()
   {
      return []; // define array structure
   };

   this.getMeasurementDescription = function()
   {
      return []; // define array structure
   };

   this.sendMessage = function( instanceId, measurements )
   {
      if ( CoreApplication.isInstanceRunning( instanceId ) )
         CoreApplication.sendMessage( instanceId, JSON.stringify( measurements ) );
   };
}

ProcessInstanceIO.prototype = new Object();

// ProcessInstanceIO factory method
ProcessInstanceIO.create = function( processIcon )
{
   let process = ProcessInstance.fromIcon( processIcon );
   if ( process.processId() == "SubframeSelector" )
      return new SubframeProcessInstanceIO( processIcon );
   if ( process.processId() == "StarAlignment" )
      return new StarAlignmentProcessInstanceIO( processIcon );
   if ( process.processId() == "Script" )
      return new ImageSolverProcessInstanceIO( processIcon );
   return undefined;
}

// SubframeSelector process subclass
function SubframeProcessInstanceIO( processIcon )
{
   this.__base__ = ProcessInstanceIO;
   this.__base__( processIcon );

   this.setInputFrames = function( inputFrames )
   {
      this.processInstance.subframes = inputFrames;
   };

   this.getInputFrames = function()
   {
      return this.processInstance.subframes;
   };

   this.createsMeasurements = function()
   {
      return true;
   };

   this.getMeasurements = function()
   {
      let result = [];
      let measurements = this.processInstance.measurements;

      for ( let i = 0; i < measurements.length; ++i )
      {
         let measurement = measurements[ i ];
         let newMeasurement = [];
         for ( let j = 0; j < measurement.length; ++j )
         {
            if ( ( j == 1 /*Enabled*/ ) || ( j == 2 /*Locked*/ ) )
               continue;
            if ( j == 3 /*Path*/ )
            {
               let tokens = measurement[ j ].split( "/" );
               newMeasurement.push( tokens[ tokens.length - 1 ] );
            }
            else
               newMeasurement.push( Math.round( measurement[ j ] * 1000000 ) / 1000000 );
         }
         result.push( newMeasurement );
      }
      return result;
   };

   this.getMeasurementDescription = function()
   {
      return [
      {
         name: 'Index',
         isMeasure: false
      },
      {
         name: 'File',
         isMeasure: false
      },
      {
         name: 'Weight',
         isMeasure: true
      },
      {
         name: 'FWHM',
         isMeasure: true
      },
      {
         name: 'Eccentricity',
         isMeasure: true
      },
      {
         name: 'SNRWeight',
         isMeasure: true
      },
      {
         name: 'Median',
         isMeasure: true
      },
      {
         name: 'MedianMeanDev',
         isMeasure: true
      },
      {
         name: 'Noise',
         isMeasure: true
      },
      {
         name: 'NoiseRation',
         isMeasure: true
      },
      {
         name: 'Stars',
         isMeasure: true
      },
      {
         name: 'StarResidual',
         isMeasure: true
      },
      {
         name: 'FWHMMeanDev',
         isMeasure: true
      },
      {
         name: 'EccentricityMeanDev',
         isMeasure: true
      },
      {
         name: 'StarResidualMeanDev',
         isMeasure: true
      } ];
   };
}

// StarAlignent process subclass
function StarAlignmentProcessInstanceIO( processIcon )
{
   this.__base__ = ProcessInstanceIO;
   this.__base__( processIcon );

   this.setInputFrames = function( inputFrames )
   {
      this.processInstance.targets = inputFrames;
   };

   this.getInputFrames = function()
   {
      return this.processInstance.targets;
   };

   this.getInputFile = function( frames, index )
   {
      return frames[ index ][ 2 ];
   };

   this.addNewFile = function( frames, file )
   {
      frames.push( [ true, true, file ] );
   };
}

// ----------------------------------------------------------------------------
// EOF ProcessWatcherProcessInstanceIO.js - Released 2020-01-22T17:07:33Z
