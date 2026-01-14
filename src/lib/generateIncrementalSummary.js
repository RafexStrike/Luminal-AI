// FILE: src/lib/generateIncrementalSummary.js
// DESCRIPTION: Main function for generating incremental summaries

import { textToJson } from './generateIncrementalSummary/textToJsonConverter.js';
import { jsonMerger } from './generateIncrementalSummary/jsonMerger.js';
import { jsonToText } from './generateIncrementalSummary/jsonToTextConverter.js';

export async function generateIncrementalSummary(arrayOfParagraphs) {
  console.log('==generateIncrementalSummary.js Enpoint Hit==');

  // 1st try block
  try {
    // note/reminder: arrayOfParagraphs has to be an array
    const jsonConvertedParagraphs = [];
    console.log('1. Received arrayOfParagraphs:', arrayOfParagraphs);

    if (!arrayOfParagraphs || !Array.isArray(arrayOfParagraphs) || arrayOfParagraphs.length === 0) {
      console.log('2. ERROR: No arrayOfParagraphs provided');
      throw new Error('arrayOfParagraphs is required');
    }

    // 2nd try block
    try {
      console.log(
        'calling the textToJsonConverter.js function for every element in the array...'
      );

      for (let i = 0; i < arrayOfParagraphs.length; i++) {
        const convertedJson = await textToJson(arrayOfParagraphs[i]);
        jsonConvertedParagraphs.push(convertedJson);
        console.log(
          `The ${i}th paragraph's converted json is: ${convertedJson}`
        );
      }
    } catch (err) {
      console.log('Error converting text to JSON:', err);
      throw err;
    }

    // 3rd try block. calling the json merger to merge the jsons.
    let mergedJson;
    try {
      console.log(
        'calling the jsonMerger.js function to merge all converted jsons...'
      );
      mergedJson = await jsonMerger(jsonConvertedParagraphs);
      console.log('Merged JSON received:', mergedJson);
    } catch (err) {
      console.log(
        'Sorry. there has been an error in the 3rd try block of generateIncrementalSummary.js. The error is,',
        err
      );
      throw err;
    }

    // 4th try block. calling the json to text converter to convert merged json to plain text.
    let finalText;
    try {
      console.log(
        'calling the jsonToText.js function to convert merged json to plain text...'
      );
      finalText = await jsonToText(mergedJson);
      console.log('Final text received:', finalText);
    } catch (err) {
      console.log(
        'Sorry. there has been an error in the 4th try block of generateIncrementalSummary.js. The error is,',
        err
      );
      throw err;
    }

    // Send the final text to the frontend
    console.log('Sending final incremental summary to the client');
    return finalText;
  } catch (err) {
    console.log(
      'Error happened in generateINcrementalSummary.js. The error is:',
      err
    );
    throw err;
  }
}
