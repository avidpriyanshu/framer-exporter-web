import { scaffoldNextjsProject } from '../project-scaffolder';
import { EnhancedComponent } from '../../pipeline/types';

describe('scaffoldNextjsProject', () => {
  it('should generate package.json with correct dependencies', () => {
    const components: EnhancedComponent[] = [];
    const project = scaffoldNextjsProject('my-site', components);

    const packageJson = project.nextjsProject.packageJson;
    expect(packageJson.dependencies).toBeDefined();
    expect(Object.keys(packageJson.dependencies)).toContain('next');
    expect(Object.keys(packageJson.dependencies)).toContain('react');
  });

  it('should generate tsconfig.json in strict mode', () => {
    const components: EnhancedComponent[] = [];
    const project = scaffoldNextjsProject('my-site', components);

    const tsconfig = project.nextjsProject.tsconfig;
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('should generate next.config.js with image optimization', () => {
    const components: EnhancedComponent[] = [];
    const project = scaffoldNextjsProject('my-site', components);

    const nextConfig = project.nextjsProject.nextConfig;
    expect(nextConfig.images).toBeDefined();
  });
});
