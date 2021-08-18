import { readFileSync, statSync, watch, writeFileSync } from 'fs';
import { basename, dirname, extname, relative, resolve } from 'path';

import simpleGit from 'simple-git';
import glob from 'fast-glob';
import { path as appRoot } from 'app-root-path';
import matter from 'gray-matter';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const git = simpleGit();

// * ================================================================================

const README_MD = 'README.md';

const fileCache: Record<
  string,
  {
    matter?: matter.GrayMatterFile<string>;
    date?: string;

    content?: string;

    cate?: string;
    title?: string;
  }
> = {};

const cateMap: Record<string, string[]> = {};

const task = async () => {
  updateReadme();
};

// * ----------------------------------------------------------------

const updateReadme = async () => {
  const readmeFilePath = resolve(appRoot, README_MD);

  const allMdFiles = await getAllMdFiles();

  allMdFiles.forEach((p) => {
    cateMap[getFileCate(p)] ??= [];
    cateMap[getFileCate(p)].push(p);
  });

  await Promise.all(allMdFiles.map(ensureFileDate));

  const toc = Object.entries(cateMap)
    .map(
      ([cate, files]) =>
        `
        ### ${cate}

        ${files
          .map(
            (p) => `- [${getFileTitle(p)}](${encodeURI(relative(appRoot, p))}) ${getFileDate(p)}`,
          )
          .join('\n')}
      `,
    )
    .join('\n')
    .split('\n')
    .map((e) => e.trim())
    .join('\n');

  const readmeFileContent = readFileSync(readmeFilePath, 'utf-8');

  const newContent = readmeFileContent.replace(
    /<!-- toc:start -->(.|\n)*<!-- toc:end -->/m,
    `
    <!-- toc:start -->
    ${toc}
    <!-- toc:end -->
    `
      .split('\n')
      .map((e) => e.trim())
      .join('\n'),
  );

  writeFileSync(readmeFilePath, newContent);

  git.add(readmeFilePath);
};

// * ----------------------------------------------------------------

const getAllMdFiles = async () => {
  return glob(`${appRoot}/[!node_modules]*/*.md`);
};

// * ----------------------------------------------------------------

const getFc = (filePath: string) => (fileCache[filePath] ??= {});

const getFileContent = (filePath: string) => {
  return (getFc(filePath).content ??= readFileSync(filePath, 'utf-8'));
};

const getFileMatter = (filePath: string) => {
  return (getFc(filePath).matter ??= matter(getFileContent(filePath)));
};

const getFileDate = (filePath: string) => getFc(filePath).date!;

const ensureFileDate = async (filePath: string) => {
  const fc = getFc(filePath);
  if (fc.date) return;

  fc.date ??= getFileMatter(filePath).data.date ?? (await updateFileDateAndReturn(filePath));
};

const getFileCate = (filePath: string) => (getFc(filePath).cate ??= basename(dirname(filePath)));

const getFileTitle = (filePath: string) => {
  const fc = getFc(filePath);
  if (fc.title) return fc.title;

  const h1Search = getFileContent(filePath).match(/\s?#{1}(.*)$/m);
  const title = h1Search?.[1].trim() ?? basename(filePath, extname(filePath));

  return (fc.title ??= title);
};

// * ----------------------------------------------------------------

const updateFileDateAndReturn = async (filePath: string) => {
  const grayMatterFile = getFileMatter(filePath);

  const date = await getFileFsTime(filePath);

  grayMatterFile.data.date = date;
  const newFileContext = grayMatterFile.stringify('');
  writeFileSync(filePath, newFileContext);

  git.add(filePath);

  return date;
};

const getFileFsTime = async (filePath: string): Promise<string> => {
  const fileCreateDate = await getFileCreateDate(filePath);
  const fileGitTime = await getFileFirstGitDate(filePath);

  const useGitTime = fileGitTime && fileGitTime.getTime() < fileCreateDate.getTime();
  const rebuiltDate = useGitTime ? fileGitTime : fileCreateDate;

  return dayjs.utc(rebuiltDate).utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
};

const getFileFirstGitDate = async (filePath: string): Promise<Date> => {
  const fileGitStat = await git.log({ file: filePath });
  return new Date(fileGitStat.all[fileGitStat.all.length - 1].date);
};

const getFileCreateDate = async (filePath: string): Promise<Date> => {
  const stat = statSync(filePath);
  return Promise.resolve(stat.birthtime);
};

// * ================================================================================

task();