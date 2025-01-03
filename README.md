# Menu OCR to Image

## Features

- Uses **LLaMA Vision 3.2-90B** to extract text from restaurant menu images with high accuracy.   
- **AWS S3 Storage**: The S3 bucket stores menu images temporarily. Uploaded images get a public URL for LLaMA Vision to perform OCR. This approach ensures scalable handling of multiple images and provides accessible URLs for efficient processing.  
- **Google Search**: Used to search for and obtain representative images of each dish on the menu that has been extracted by OCR.
- **Upstash Redis Caching**: Improves performance and reduces overhead by caching frequent queries.

## Technologies

- **Next.js**: React framework for server-side rendering and API routes  
- **TypeScript**: Static type checking for a more robust development experience  
- **AWS SDK**: Integrates with AWS services, primarily S3  
- **Multer**: Middleware for handling file uploads  
- **Axios**: HTTP client for making external API requests  
- **Together AI (LLaMA)**: Large-scale AI models for OCR and text parsing  
- **Upstash Redis**: Serverless Redis solution for caching

## LLaMA Models

- **LLaMA Vision 3.2-90B-Instruct-Turbo**  
  - **What for**: OCR for menu images  
  - **Why**: Provides high-fidelity text recognition from menu images

- **Meta-LLaMA 3.1-8B-Instruct-Turbo**  
  - **What for**: Transforms extracted text into a structured JSON format  
  - **Why**: Fast and efficient textual processing

## Configuration

### Prerequisites

- **Node.js**: v14 or newer.
- **AWS S3**: Bucket with appropriate CORS and IAM configurations.
- **Together AI**: API key for LLaMA Vision and Parsing models.
- **Google Cloud**: API key and search engine ID for Google Custom Search.
- **Upstash**: Redis endpoint and token for caching.

### AWS S3 Setup

1. **Create an S3 Bucket**  
   - Log in to the AWS S3 console.  
   - Create a new bucket with a unique name and a suitable region.  
   - Disable public access blocking if you intend to allow uploads and external access.

2. **Configure CORS**  
   - Go to your new bucket’s settings.  
   - Under **Permissions** > **CORS**, add the following configuration:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedOrigins": ["*"],
         "ExposeHeaders": []
       }
     ]
     ```

3. **Create an IAM User**  
   - In the AWS IAM console, create a new user with programmatic access.  
   - Attach the `AmazonS3FullAccess` policy to allow full S3 operations.  
   - Save the **Access Key ID** and **Secret Access Key** for later use.

### Required APIs

1. **Together AI**  
   - Sign up at [Together AI](https://together.xyz/) and obtain your API key.

2. **Google Custom Search**  
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).  
   - Create a new project, enable the **Custom Search API**, and generate API credentials.  
   - Set up a **Programmable Search Engine** via [Programmable Search Engine](https://programmablesearchengine.google.com/) to restrict your searches if needed.

3. **Upstash Redis**  
   - Sign up at [Upstash](https://upstash.com/) and retrieve your **Redis URL** and **Token**.

### Environment Variables

Copy the `.env.example` file to `.env` and fill in your credentials:


### Installation
1. Clone the repository.
2. Configure `.env` with your API keys and credentials.
3. Install dependencies with `npm install`.
4. Start the development server with `npm run dev`.

### Usage
1. Upload an image of a restaurant menu to the `/upload` endpoint.
2. The image will be processed by the OCR model and the result will be displayed in the `/ocr` endpoint.
3. The parsed JSON will be displayed in the `/parse` endpoint.

