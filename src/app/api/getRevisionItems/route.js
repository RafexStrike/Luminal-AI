// src/app/api/getRevisionItems/route.js
//                                                                                                                                                                    
//     mm    mm                                                mm               mmmm                                                                                  
//     ##    ##                                                ##             ##""""#                                                                          ##     
//     ##    ##  ##m####m  ##    ##  mm#####m   m####m    m###m##            ##"        m####m   ####m##m  ##m###m    m####m   ##m####m   m####m   ##m####m  #######  
//     ##    ##  ##"   ##  ##    ##  ##mmmm "  ##mmmm##  ##"  "##            ##        ##"  "##  ## ## ##  ##"  "##  ##"  "##  ##"   ##  ##mmmm##  ##"   ##    ##     
//     ##    ##  ##    ##  ##    ##   """"##m  ##""""""  ##    ##            ##m       ##    ##  ## ## ##  ##    ##  ##    ##  ##    ##  ##""""""  ##    ##    ##     
//     "##mm##"  ##    ##  ##mmm###  #mmmmm##  "##mmmm#  "##mm###             ##mmmm#  "##mm##"  ## ## ##  ###mm##"  "##mm##"  ##    ##  "##mmmm#  ##    ##    ##mmm  
//       """"    ""    ""   """" ""   """"""     """""     """ ""               """"     """"    "" "" ""  ## """      """"    ""    ""    """""   ""    ""     """"  
//                                                                                                         ##                                                         
//                                                                                                                                                                    
import { generateResourcesForRevision } from "@/lib/generateResourcesForRevision";
// import { connectDB } from "@/lib/mongodb";
// import Chat from "@/models/Chat"; 

export async function POST(req) {
  try {
    const { chatId } = await req.json();
    await connectDB();

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
      });
    }

    // If already generated before, reuse
    if (chat.revisionItems && chat.revisionItems.length > 0) {
      return new Response(
        JSON.stringify({ revisionItems: chat.revisionItems }),
        { status: 200 }
      );
    }

    // Otherwise, generate new ones
    const revisionData = await generateResourcesForRevision(chat.messages);

    // Save in DB for next time
    chat.revisionItems = revisionData.revisionItems;
    await chat.save();

    return new Response(JSON.stringify(revisionData), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
