import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as fs from 'node:fs/promises';
import {join, resolve} from 'path';

@Injectable()
export class UploadService {
  private CDNdomain: string;
  private assetsPath: string;

  constructor(private configService: ConfigService) {
    this.CDNdomain = this.configService.get<string>('CDN_DOMAIN') || '';
    this.assetsPath = this.configService.get<string>('ASSETS_PATH') || '';
  }

  genFileName(ext: string) {
    const uniqSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${uniqSuffix}${ext}`;
    return fileName;
  }

  async put(buffer: Buffer, ext: string, folder?: string) {
    // Убираем лишние точки
    const cleanExt = `.${ext.replace(/\./g, '')}`;
    const fileName = this.genFileName(cleanExt);

    // Путь до целевой папки
    const targetFolder = resolve(
      folder ? join(this.assetsPath, folder) : this.assetsPath,
    );

    // Создаем папку (и вложенные) при необходимости
    await fs.mkdir(targetFolder, {recursive: true});

    // Полный путь к файлу
    const fullPath = join(targetFolder, fileName);

    // Записываем файл
    await fs.writeFile(fullPath, buffer);

    const relativePath = folder ? join(folder, fileName) : fileName;

    return {url: `${this.CDNdomain}/${relativePath}`};
  }
}
