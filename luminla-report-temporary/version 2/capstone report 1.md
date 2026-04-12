

# **1\. Introduction**

## **1.1 Background and Motivation**

The rapid advancement of Artificial Intelligence (AI) has significantly reshaped the landscape of education. Among recent breakthroughs, Large Language Models (LLMs) have emerged as one of the most transformative technologies in natural language processing. Built upon transformer architectures and trained on massive corpora of text data, these models demonstrate advanced capabilities in reasoning, summarization, question answering, tutoring, and interactive dialogue generation \[1\], \[2\], \[3\]. Their ability to generalize across tasks without task-specific retraining has fundamentally changed how intelligent systems are deployed in real-world applications.

The educational sector has particularly benefited from these developments. Intelligent tutoring systems (ITS) have long been studied as a means of delivering personalized education at scale \[4\]. Traditional ITS systems, however, required handcrafted rules, domain-specific ontologies, and carefully engineered pipelines. The introduction of LLMs has reduced the barrier to building interactive AI tutors by enabling flexible natural language interfaces capable of handling open-ended student queries.

Recent studies suggest that AI-assisted tutoring can improve student engagement, provide adaptive scaffolding, and support self-paced learning \[4\]. Additionally, conversational AI systems allow iterative questioning, clarification, and contextual explanation, aligning with constructivist and inquiry-based learning frameworks.

Despite these advancements, current AI learning tools remain fragmented. Students frequently rely on multiple disconnected tools:

* One application for chat-based explanation  
* Another for note-taking  
* A separate platform for flashcards  
* A spaced repetition tool for revision scheduling  
* External tools for document summarization

This fragmentation creates cognitive switching costs and reduces workflow efficiency. Furthermore, most AI chat systems generate responses without maintaining structured knowledge over time. As conversations grow longer, models lose earlier context due to token limitations, leading to knowledge degradation.

Another significant limitation lies in summarization systems. Traditional summarization models generate summaries from scratch given an input document. When new information is added, the summary must be regenerated entirely. This approach becomes computationally inefficient and risks losing previously refined content \[5\]. In educational settings where students continuously add notes, lectures, and questions, static summarization fails to support dynamic knowledge growth.

Simultaneously, research in cognitive psychology has consistently demonstrated that effective learning requires more than explanation. Long-term retention depends heavily on spaced repetition and retrieval practice \[6\], \[7\]. Many AI chat platforms provide answers but do not actively support memory reinforcement strategies.

Finally, hallucination and factual inconsistency remain critical concerns in open-domain language models \[8\]. Without grounding mechanisms, LLMs may generate plausible yet incorrect responses. Retrieval-Augmented Generation (RAG) frameworks address this by combining parametric language models with external knowledge retrieval systems \[8\].

In response to these identified gaps, this project introduces **Luminal AI**, an integrated AI-powered student learning platform that unifies conversational tutoring, incremental summarization, flashcard generation, spaced repetition scheduling, and retrieval-augmented generation into a cohesive system.

---

# **1.2 Research Problem**

The central research problem addressed in this project can be articulated as follows:

How can a unified AI-driven educational platform integrate incremental knowledge accumulation, memory-optimized scheduling, and retrieval grounding to improve student learning efficiency and retention?

Sub-problems include:

1. How to design a scalable incremental summarization pipeline that updates structured knowledge progressively without regenerating summaries entirely?  
2. How to integrate spaced repetition scheduling within a conversational AI workflow?  
3. How to reduce hallucination risk while maintaining conversational fluency?  
4. How to architect a full-stack system capable of supporting these features in real-world deployment?

---

# **1.3 Research Objectives**

The objectives of this capstone project are:

1. To design and implement a production-ready AI learning platform.  
2. To implement a structured, multi-stage incremental summarization pipeline.  
3. To integrate an FSRS-inspired spaced repetition scheduler aligned with cognitive science principles.  
4. To implement retrieval-augmented generation for grounded responses.  
5. To evaluate architectural scalability and functional usability.

---

# **2\. Literature Review**

## **2.1 Large Language Models**

The transformer architecture introduced by Vaswani et al. \[3\] replaced recurrent architectures with self-attention mechanisms capable of modeling long-range dependencies efficiently. This innovation enabled scaling to billions of parameters.

Brown et al. introduced GPT-3, demonstrating few-shot learning capabilities across diverse tasks without fine-tuning \[1\]. The GPT-4 technical report further documented improvements in reasoning, alignment, and multi-modal capabilities \[2\].

These developments indicate that LLMs can serve as general-purpose reasoning engines capable of educational dialogue generation.

However, limitations include:

* Hallucination  
* Lack of persistent memory  
* Context window constraints  
* Non-deterministic behavior

These limitations motivate architectural augmentation rather than pure reliance on parametric knowledge.

---

## **2.2 Incremental Summarization**

Traditional summarization approaches are categorized as extractive or abstractive. Extractive methods select key sentences, while abstractive methods generate new paraphrased summaries. Both approaches assume a static input document.

Incremental summarization extends this paradigm by updating summaries as new information arrives \[5\]. Instead of regenerating summaries from scratch, structured representations are updated iteratively.

Recent work explores JSON-based intermediate structures that allow semantic merging \[5\]. Hierarchical dialogue summarization approaches also propose maintaining multi-level representations for long conversations \[9\].

The benefits include:

* Reduced computational redundancy  
* Preservation of earlier refinement  
* Improved coherence across updates  
* Scalability for long-running conversations

This project adopts a three-stage pipeline:

1. Text → Structured JSON representation  
2. JSON merge with previous summary state  
3. JSON → Refined prose summary

This structured approach ensures stability and knowledge continuity.

---

## **2.3 Spaced Repetition and Memory Science**

Ebbinghaus first quantified the forgetting curve, demonstrating exponential memory decay over time \[7\]. Later research confirmed that distributed practice improves long-term retention compared to massed learning \[6\].

Modern spaced repetition algorithms estimate memory stability and difficulty parameters to determine optimal review intervals. Retrieval practice has been shown to strengthen memory consolidation more effectively than passive review \[10\].

Integrating these findings into AI systems ensures that learning platforms do not merely provide answers but actively optimize retention.

---

## **2.4 Retrieval-Augmented Generation**

Lewis et al. introduced Retrieval-Augmented Generation (RAG), combining dense retrieval mechanisms with generative models \[8\]. Instead of relying solely on model parameters, RAG retrieves relevant documents and conditions generation on them.

Sentence-BERT embeddings enable semantic similarity search in vector databases \[11\]. This method significantly reduces hallucination risk and increases factual grounding.

Luminal AI integrates embedding-based retrieval to ground responses in user-uploaded documents.

---

# **3\. System Architecture Overview**

---

# **4\. System Design and Implementation** 

## **4.1 Incremental Summarization**

---

## **4.2 Flashcard Generation and Scheduling**

---

## **4.3 Retrieval-Augmented Answer Generation**

---

# **5\.  Experimental Evaluation**

---

# **6\. Discussion**

# **7\.  Conclusion & Future Work**

# **References**

\[1\] Brown, T. B., et al. (2020). Language Models are Few-Shot Learners. NeurIPS.  
\[2\] OpenAI. (2023). GPT-4 Technical Report. arXiv.  
\[3\] Vaswani, A., et al. (2017). Attention Is All You Need. NeurIPS.  
\[4\] Woolf, B. (2010). Building Intelligent Interactive Tutors. Morgan Kaufmann.  
\[5\] Hwang, Y., et al. (2024). Incremental Summarization with Structured Representations.  
\[6\] Cepeda, N. J., et al. (2006). Distributed Practice in Verbal Recall Tasks. Psychological Bulletin.  
\[7\] Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology.  
\[8\] Lewis, P., et al. (2020). Retrieval-Augmented Generation. NeurIPS.  
\[9\] Zhao, W., et al. (2021). Dialogue Summarization with Hierarchical Transformers. ACL.  
\[10\] Roediger, H. L., & Butler, A. C. (2011). Retrieval Practice in Long-Term Retention. Trends in Cognitive Sciences.  
\[11\] Reimers, N., & Gurevych, I. (2019). Sentence-BERT. EMNLP.

