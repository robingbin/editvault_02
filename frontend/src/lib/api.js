import axios from 'axios';
import { http, getToken } from './store';

export { http };

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Upload a File object to the backend. Returns { url, filename, original_name, size, content_type }
export async function uploadFile(file, onProgress) {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post(`${API}/uploads`, form, {
    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${getToken() || ''}` },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total));
    },
  });
  return res.data;
}

export const absoluteUrl = (relOrAbs) => {
  if (!relOrAbs) return '';
  if (/^https?:/i.test(relOrAbs)) return relOrAbs;
  return `${BACKEND_URL}${relOrAbs}`;
};

export const downloadUrl = (relUrl, downloadAs) => {
  if (!relUrl) return '';
  const base = absoluteUrl(relUrl);
  const sep = base.includes('?') ? '&' : '?';
  return downloadAs ? `${base}${sep}download=${encodeURIComponent(downloadAs)}` : base;
};

export const fileToDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});
