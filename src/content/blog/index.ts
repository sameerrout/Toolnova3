import type { ComponentType } from 'react';
import { HowToMergePdfsWithoutUploadingThemArticle } from './how-to-merge-pdfs-without-uploading-them';
import { HowToCompressImagesForTheWebArticle } from './how-to-compress-images-for-the-web';
import { HowToCreateAZipFileOnAnyDeviceArticle } from './how-to-create-a-zip-file-on-any-device';
import { ZipVs7zVsRarWhichArchiveFormatArticle } from './zip-vs-7z-vs-rar-which-archive-format';
import { HowToShareLargeFilesArticle } from './how-to-share-large-files';
import { WhatYourPhotosRevealAboutYouArticle } from './what-your-photos-reveal-about-you';
import { IsItSafeToUploadFilesToOnlineConvertersArticle } from './is-it-safe-to-upload-files-to-online-converters';
import { PdfPageNumbersAndBatesNumberingExplainedArticle } from './pdf-page-numbers-and-bates-numbering-explained';

/** Slug -> article body component. */
export const BLOG_ARTICLE_BODIES: Record<string, ComponentType> = {
  'how-to-merge-pdfs-without-uploading-them': HowToMergePdfsWithoutUploadingThemArticle,
  'how-to-compress-images-for-the-web': HowToCompressImagesForTheWebArticle,
  'how-to-create-a-zip-file-on-any-device': HowToCreateAZipFileOnAnyDeviceArticle,
  'zip-vs-7z-vs-rar-which-archive-format': ZipVs7zVsRarWhichArchiveFormatArticle,
  'how-to-share-large-files': HowToShareLargeFilesArticle,
  'what-your-photos-reveal-about-you': WhatYourPhotosRevealAboutYouArticle,
  'is-it-safe-to-upload-files-to-online-converters': IsItSafeToUploadFilesToOnlineConvertersArticle,
  'pdf-page-numbers-and-bates-numbering-explained': PdfPageNumbersAndBatesNumberingExplainedArticle,
};
