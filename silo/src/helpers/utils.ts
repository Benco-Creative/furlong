import { parse, HTMLElement } from "node-html-parser";
import axios from "axios";

export const removeSpanAroundImg = (htmlContent: string): string => {
  // Parse the HTML content
  const root = parse(htmlContent);

  // Find all <img> tags
  const imgTags = root.querySelectorAll("img");

  imgTags.forEach((img) => {
    const parent = img.parentNode as HTMLElement;

    // Check if the parent is a <span> tag
    if (parent && parent.tagName === "SPAN") {
      // Replace the <span> tag with its children (including the <img> tag)
      parent.replaceWith(...parent.childNodes);
    }
  });

  // Serialize the modified HTML back to a string
  return root.toString();
};

export const splitStringTillPart = (input: string, part: string): string => {
  // Split the string by '/'
  const parts = input.split("/");

  // Find the index of the part
  const index = parts.indexOf(part);

  // If the part is not found, return an empty string or handle the error as needed
  if (index === -1) {
    return "";
  }

  // Join the parts from the desired index to the end
  const result = parts.slice(index).join("/");

  // Add the leading '/' if needed
  return "/" + result;
};

export const downloadFile = async (url: string, authToken?: string | undefined): Promise<Blob | undefined> => {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer",
      headers: {
        Authorization: authToken ? authToken : undefined,
      },
    });

    const buffer = Buffer.from(response.data);
    const blob = new Blob([buffer], { type: response.headers["content-type"] });
    return blob;
  } catch (e) {
    const buffer = Buffer.from((e as any).response?.data);
    console.error("Assest download failed:", buffer.toString("utf-8"));
  }
};

interface UploadFileParams {
  url: string;
  data: FormData;
}

export const uploadFile = async ({ url, data }: UploadFileParams): Promise<boolean> => {
  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.status === 204 || response.status === 200;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Upload failed:", error.response?.data || error.message);
    } else {
      console.error("Upload failed:", error);
    }
    throw error;
  }
};
