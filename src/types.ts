export type PackageType = "npm" | "docker" | "container" | "maven" | "rubygems" | "nuget";

export type FetchPackagesResponse = {
  id: number;
  name: string;
  url: string;
  package_html_url?: string;
  html_url?: string;
  license?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: {
    package_type: PackageType;
    container?: {
      tags: Array<any>
    }
  }
}
