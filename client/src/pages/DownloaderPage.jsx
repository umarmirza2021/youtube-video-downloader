import { useLocation } from 'react-router-dom';
import DownloaderApp from '../DownloaderApp';
import { getPageByPath } from '../config/seo-pages.js';

export default function DownloaderPage() {
  const { pathname } = useLocation();
  const page = getPageByPath(pathname);

  return <DownloaderApp key={page.key} page={page} />;
}