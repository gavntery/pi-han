// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// VaryParams-driver.jsh - Released 2013/12/03 16:15:08 UTC
// ****************************************************************************
//
// This file is part of VaryParams script version 1.5
// 
// The complete source code with test scripts is hosted at:
//    https://bitbucket.org/bitli/varyparams
//
// Copyright (c) 2012-2013 Jean-Marc Lugrin
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

function vP_makeEngineCreationError(msg, shouldSaveParameters) {
   return {
      // This must be non null if there is an error, as the caller test if this property is 'true'
      // to detect if there is an error.  It is set to false if a correct engine is returned.
      engineCreationError: msg,
      shouldSaveParameters: shouldSaveParameters || false
   }
}

// -- Main method to create the processing engine
function vP_makeProcessEngine(environment,guiParameters) {

#ifdef DEBUG
   Console.writeln("vp_makeProcessEngine: " + guiParameters.toString());
#endif
   // Check that we have all required information

   if (vP_isBlank(guiParameters.processInstanceName)) {
      return vP_makeEngineCreationError( "You must select a process instance. ");
   }
   if (vP_isBlank(guiParameters.parameterToVary)) {
      return vP_makeEngineCreationError("You must select a parameter to vary. ");
   }
   if (vP_isBlank(guiParameters.parameterValuesText)) {
      return vP_makeEngineCreationError("You must enter a list of values for the parameter '" + this.parameterToVary +"'. ");
   }
   if (guiParameters.operateOn === VP_OPERATE_UNDEFINED) {
      return vP_makeEngineCreationError("Type of process not initialized. ");
   }
   if (guiParameters.resultDestination === VP_RESULT_UNDEFINED) {
      return vP_makeEngineCreationError("Result destination not initialized. ");
   }

   // Create the engine and parameterize it
   var engine = new Vp_VaryProcessEngine(environment);

   engine.setProcessInstanceName(guiParameters.processInstanceName);

   switch (guiParameters.operateOn) {
      case VP_OPERATE_MODIFYING_SOURCE:
         if (guiParameters.sourceView.window.isModified)  {
            // This restriction is required as we use the 'modified' flag to check for accidental modification of a source window
            return vP_makeEngineCreationError( "VaryParams operates only on unmodified windows - save your window or work on a copy: " + guiParameters.sourceView.window.mainView.fullId, true);
         }
         // As the process modifies the source, we must operate on a copy to leave the source unchanged
         engine.setOperateOnCopyOfSourceView(guiParameters.sourceView)
         break;
      case VP_OPERATE_PROCESS_GENERATING_NEW_WINDOW:
         if (guiParameters.sourceView.window.isModified)  {
            // This restriction is required as we use the 'modified' flag to check for accidental modification of a source window
            return vP_makeEngineCreationError("VaryParams operates only on unmodified windows - save your window or work on a copy: " + guiParameters.sourceView.window.mainView.fullId, true);
         }
         // As the process generate a new image, we can operate on the original one
         engine.setOperateGenerateNewView(guiParameters.sourceView);
         break;
      case VP_OPERATE_GLOBALLY:
         engine.setExecuteGlobally();
         break;
      default:
         return vP_makeEngineCreationError("Operation type not initialized");
   }

   switch(guiParameters.resultDestination) {
      case VP_RESULT_IN_FILES:
         engine.setSaveViewAsFile(guiParameters.outputDirectory, guiParameters.overwriteOutputFiles);
         break;
      case VP_RESULT_IN_WINDOWS:
         engine.setKeepViewInWorkspace();
         break;
      case VP_RESULT_IN_PREVIEWS:
         if (guiParameters.operateOn != VP_OPERATE_MODIFYING_SOURCE) {
            return vP_makeEngineCreationError("Only process updating the source image can generate new previews");
         }
         engine.setSaveViewAsPreview(guiParameters.deleteOtherPreviews);
         break;
      default:
         return vP_makeEngineCreationError("Result handling not initialized");
   }

   // Convert the list of values to an array and set it in the engine
   //TODO support alternate specifications (list comprehension, general evaluation),
   // If possible parameters from other icons
   var parameterJSONexpression = "[" + guiParameters.parameterValuesText.trim() + "]";
#ifdef DEBUG
   Console.writeln("vp_makeProcessEngine: Parsing JSON expression: ", parameterJSONexpression);
#endif
   try {
      var values = JSON.parse(parameterJSONexpression);
#ifdef DEBUG
      Console.writeln("vp_makeProcessEngine: Parsed parameterValues: ", values);
#endif
   } catch (e) {
         return vP_makeEngineCreationError("The list of parameters '" + guiParameters.parameterValuesText.trim() + "' has an invalid syntax");
   }
   engine.setParameters(guiParameters.parameterToVary,values);
   return engine;
}

// ****************************************************************************
// EOF VaryParams-driver.jsh - Released 2013/12/03 16:15:08 UTC
