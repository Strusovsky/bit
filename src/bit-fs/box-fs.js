/** @flow */
import * as mkdirp from 'mkdirp';
import * as fs from 'fs-extra';
import * as path from 'path';
import glob from 'glob';
import { BIT_DIR_NAME, RESOURCES, BIT_EXTERNAL_DIRNAME, BIT_INLINE_DIRNAME, BIT_JSON, BIT_IMPL_FILE_NAME } from '../constants';
import BitJsonManager from '../box/bit-json-manager';
import type Opts from '../cli/command-opts-interface';

export default class BoxFs {

  /**
   * @private
   **/
  static composeBoxPath(p: string): string {
    return path.join(p, BIT_DIR_NAME);
  }

  static composeBitInlinePath(boxPath: string, name: string) {
    return path.join(boxPath, BIT_DIR_NAME, BIT_INLINE_DIRNAME, name);
  }

  static composeBitExternalPath(boxPath: string, name: string) {
    return path.join(boxPath, BIT_DIR_NAME, BIT_EXTERNAL_DIRNAME, name);
  }

  static removeBit(bitName: string, boxPath: string) {
    const isInline = this.bitExistsInline(bitName, boxPath);
    const bitPath = isInline ?
    this.composeBitInlinePath(boxPath, bitName) 
    : this.composeBitExternalPath(boxPath, bitName);
    fs.removeSync(bitPath);
    
    return bitPath;
  }

  static listInlineNames(boxPath: string) {
    return glob.sync(this.composeBitInlinePath(boxPath, '/*'))
    .map(fullPath => path.basename(fullPath));
  }

  static listExternalNames(boxPath: string) {
    return glob.sync(this.composeBitExternalPath(boxPath, '/*'))
    .map(fullPath => path.basename(fullPath));
  }

  static createBit(bitName: string, boxPath: string, { withTests }: Opts) {
    // @TODO -- add tests on the flag withTests
    const bitPath = this.composeBitInlinePath(boxPath, bitName);
    mkdirp.sync(bitPath);
    fs.writeFileSync(path.join(bitPath, BIT_IMPL_FILE_NAME), fs.readFileSync(path.resolve(__dirname, '../../resources/impl.template.js')));
    
    return bitPath;
  }

  static exportBit(bitName: string, boxPath: string) {
    const sourcePath = this.composeBitInlinePath(boxPath, bitName);
    const destPath = this.composeBitExternalPath(boxPath, bitName);
    
    fs.copySync(sourcePath, destPath);
    fs.removeSync(sourcePath);
  }

  static bitExists(bitName: string, boxPath: string) {
    return this.bitExistsInline(bitName, boxPath) || this.bitExistsExternal(bitName, boxPath);  
  }

  static bitExistsInline(bitName: string, boxPath: string) {
    return fs.existsSync(this.composeBitInlinePath(boxPath, bitName));
  }

  static bitExistsExternal(bitName: string, boxPath: string) {
    return fs.existsSync(this.composeBitExternalPath(boxPath, bitName));
  }

  /**
   * @private
   **/
  static composePath(p: string, inPath: string) {
    return path.join(this.composeBoxPath(p), inPath); 
  }

  static createBox(p: string): boolean {
    if (this.pathHasBox(p)) return false;
    BitJsonManager.createBitJson(p);
    console.log(BitJsonManager.loadBitJson(p))
    this.createDir(p, BIT_EXTERNAL_DIRNAME);
    this.createDir(p, BIT_INLINE_DIRNAME);
    return true;
  }
  
}
