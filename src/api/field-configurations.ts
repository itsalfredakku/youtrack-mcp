/**
 * Field Configurations for API Responses
 * 
 * Defines field sets for list vs. detail operations to optimize payload size.
 * List operations return minimal fields, detail operations return complete data.
 */

/**
 * Issue field configurations
 */
export const IssueFields = {
  /**
   * Minimal fields for issue lists (summary view)
   * Returns only essential information for scanning lists
   */
  LIST: '$type,id,idReadable,summary,customFields($type,id,name,value($type,id,name)),project($type,id,shortName),created,updated,reporter($type,login,fullName)',
  
  /**
   * Complete fields for single issue (detail view)
   * Returns all information including full description, comments, links
   */
  DETAIL: '$type,id,idReadable,summary,description,created,updated,resolved,numberInProject,project($type,id,name,shortName),reporter($type,id,login,fullName),updater($type,id,login,fullName),customFields($type,id,name,value($type,id,name)),links($type,id,direction,linkType($type,id,name,localizedName)),tags($type,id,name),watchers($type,id,hasStar),comments($type,id,text,author($type,login,fullName),created),attachments($type,id,name,size,mimeType,url)',
  
  /**
   * Search/query fields (balanced view)
   * Returns more than list but less than full detail
   */
  SEARCH: '$type,id,idReadable,summary,description,customFields($type,id,name,value($type,id,name)),project($type,id,shortName),created,updated,reporter($type,login,fullName),tags($type,id,name)'
};

/**
 * Article (Knowledge Base) field configurations
 */
export const ArticleFields = {
  /**
   * Minimal fields for article lists
   * Excludes full content to keep lists lightweight
   */
  LIST: '$type,id,idReadable,summary,project($type,id,shortName),created,updated,updatedBy($type,login,fullName),parentArticle($type,id,idReadable)',
  
  /**
   * Complete fields for single article
   * Returns full content and all metadata
   */
  DETAIL: '$type,id,idReadable,summary,content,project($type,id,name,shortName),created,updated,updatedBy($type,login,fullName),reporter($type,login,fullName),parentArticle($type,id,idReadable),attachments($type,id,name,size),comments($type,id,text,author($type,login),created),tags($type,id,name)',
  
  /**
   * Search fields for articles
   * Returns summary with preview but not full content
   */
  SEARCH: '$type,id,idReadable,summary,project($type,id,shortName),created,updated,updatedBy($type,login,fullName),tags($type,id,name)'
};

/**
 * Project field configurations
 */
export const ProjectFields = {
  /**
   * Minimal fields for project lists
   */
  LIST: '$type,id,name,shortName,description,archived,leader($type,login,fullName)',
  
  /**
   * Complete fields for single project
   */
  DETAIL: '$type,id,name,shortName,description,archived,leader($type,login,fullName),team($type,id,name),customFields($type,id,name,fieldType),createdBy($type,login,fullName),iconUrl'
};

/**
 * User field configurations
 */
export const UserFields = {
  /**
   * Minimal fields for user lists
   */
  LIST: '$type,id,login,fullName,email,banned,guest,ringId',
  
  /**
   * Complete fields for single user
   */
  DETAIL: '$type,id,login,fullName,email,banned,guest,ringId,profiles($type,general,notifications,timetracking),tags($type,id,name),savedQueries($type,id,name,query)'
};

/**
 * Work Item field configurations
 */
export const WorkItemFields = {
  /**
   * Minimal fields for work item lists
   */
  LIST: '$type,id,date,duration($type,minutes,presentation),author($type,login,fullName),issue($type,id,idReadable),type($type,id,name)',
  
  /**
   * Complete fields for single work item
   */
  DETAIL: '$type,id,date,duration($type,minutes,presentation),text,author($type,login,fullName),creator($type,login,fullName),issue($type,id,idReadable,summary),type($type,id,name),created,updated,attributes($type,id,name,value)'
};

/**
 * Agile Board field configurations
 */
export const AgileBoardFields = {
  /**
   * Minimal fields for board lists
   */
  LIST: '$type,id,name,owner($type,login,fullName),projects($type,id,shortName),status($type,valid)',
  
  /**
   * Complete fields for single board
   */
  DETAIL: '$type,id,name,owner($type,login,fullName),projects($type,id,name,shortName),columnSettings($type,columns($type,id,presentation),field($type,id,name)),swimlaneSettings($type,enabled,field($type,id,name)),sprintsSettings($type,enabled),status($type,valid)'
};

/**
 * Sprint field configurations
 */
export const SprintFields = {
  /**
   * Minimal fields for sprint lists
   */
  LIST: '$type,id,name,start,finish,archived,isDefault',
  
  /**
   * Complete fields for single sprint
   */
  DETAIL: '$type,id,name,goal,start,finish,archived,isDefault,issues($type,id,idReadable,summary),unresolvedIssuesCount,previousSprint($type,id,name)'
};

/**
 * Activity field configurations
 */
export const ActivityFields = {
  /**
   * Minimal fields for activity lists
   */
  LIST: '$type,id,timestamp,author($type,login,fullName),category($type,id),target($type,id,idReadable)',
  
  /**
   * Complete fields for single activity
   */
  DETAIL: '$type,id,timestamp,author($type,login,fullName),category($type,id),target($type,id,idReadable,summary),added,removed,field($type,id,name),targetMember'
};

/**
 * Comment field configurations
 */
export const CommentFields = {
  /**
   * Minimal fields for comment lists
   */
  LIST: '$type,id,text,author($type,login,fullName),created,updated,deleted',
  
  /**
   * Complete fields for single comment
   */
  DETAIL: '$type,id,text,author($type,login,fullName),created,updated,deleted,attachments($type,id,name,size),visibility($type,permittedGroups,permittedUsers),reactions($type,id,reaction,author($type,login))'
};

/**
 * Saved Query field configurations
 */
export const SavedQueryFields = {
  /**
   * Minimal fields for saved query lists
   */
  LIST: '$type,id,name,query,owner($type,login,fullName)',
  
  /**
   * Same as list - saved queries are already minimal
   */
  DETAIL: '$type,id,name,query,owner($type,login,fullName)'
};

/**
 * Custom Field field configurations
 */
export const CustomFieldFields = {
  /**
   * Minimal fields for custom field lists
   */
  LIST: '$type,id,name,fieldType($type,id),localizedName,ordinal',
  
  /**
   * Complete fields for single custom field
   */
  DETAIL: '$type,id,name,fieldType($type,id),localizedName,ordinal,fieldDefaults($type,bundle,canBeEmpty,isPublic),instances($type,id,project($type,shortName))'
};

/**
 * Helper function to get appropriate fields based on operation type
 */
export function getFields(entity: string, operation: 'list' | 'detail' | 'search'): string {
  const fieldMap: Record<string, any> = {
    issue: IssueFields,
    article: ArticleFields,
    project: ProjectFields,
    user: UserFields,
    workItem: WorkItemFields,
    agileBoard: AgileBoardFields,
    sprint: SprintFields,
    activity: ActivityFields,
    comment: CommentFields,
    savedQuery: SavedQueryFields,
    customField: CustomFieldFields
  };
  
  const fields = fieldMap[entity];
  if (!fields) {
    throw new Error(`Unknown entity type: ${entity}`);
  }
  
  const operationType = operation.toUpperCase() as 'LIST' | 'DETAIL' | 'SEARCH';
  return fields[operationType] || fields.LIST;
}
