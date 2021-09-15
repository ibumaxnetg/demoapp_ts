class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public manday: number,
    public status: ProjectStatus,
  ) {}
}

enum ProjectStatus {
  Active,
  Finished,
}

// validate
interface Validatable {
  value: string | number; // 受け取る値
  required?: boolean; // 必須判定
  minlength?: number; // 最大文字数
  maxlength?: number; // 最小文字数
  min?: number; // 最大値
  max?: number; // 最小値
}

type Listener = (items: Project[]) => void;





// autobind decoretor
function autobind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const acjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return acjDescriptor;
}


function validate( validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (validatableInput.minlength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length >= validatableInput.minlength;
  }
  if (validatableInput.maxlength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxlength;
  }
  if (validatableInput.min != null && typeof validatableInput.min === 'number') {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (validatableInput.max != null && typeof validatableInput.max === 'number') {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}







class ProjectState{
  private static instance: ProjectState;
  private projects: Project[] = [];
  private projectListeners: Listener[] = [];
  private constructor() {

  }

  addProject(title: string, description: string, manday: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      manday,
      ProjectStatus.Active,
    );
    // {
      // id: Math.random().toString(),
      // title: title,
      // description: description,
      // manday: manday,
    // }
    this.projects.push(newProject);
    for (const listenerFn of this.projectListeners) {
      listenerFn(this.projects.slice());
    }
  }

  addListener(listenerFn: Listener) {
    this.projectListeners.push(listenerFn);
  }

  static getInstance() {
    if (!ProjectState.instance) {
      ProjectState.instance = new ProjectState();
    }
    return ProjectState.instance;
  }

}


class ProjectList {
  inputElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  ulElement: HTMLElement;
  assignedProjects: Project[];

  constructor(private ul_type: 'active' | 'finished') {
    this.inputElements = document.getElementById('project-list')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;
    this.assignedProjects = [];

    const addNode = document.importNode(this.inputElements.content, true);
    this.ulElement = addNode.firstElementChild as HTMLFormElement;
    this.ulElement.id = `${this.ul_type}-projects`;

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(prj => {
        if (ul_type === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      })

      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });

    this.configure();
    this.attach();
    this.renderContent();
  }

  private renderProjects() {
    const listEl = document.getElementById(`${this.ul_type}-projects-list`)! as HTMLUListElement;
    listEl.innerHTML = '';
    for (const prjItem of this.assignedProjects) {
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }

  }

  private renderContent() {
    const listLi = `${this.ul_type}-projects-list`;
    this.ulElement.querySelector('ul')!.id = listLi;
    this.ulElement.querySelector('h2')!.textContent = this.ul_type === 'active' ? '実行中オブジェクト': '完了オブジェクト';
  }

  private configure() {

  }

  private attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.ulElement);
  }

}


class ProjectInput {
  inputElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  formElement: HTMLFormElement;

  ttlInputElement: HTMLInputElement;
  dscrInputElement: HTMLInputElement;
  mdInputElement: HTMLInputElement;

  constructor() {
    this.inputElements = document.getElementById('project-input')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;

    const addNode = document.importNode(this.inputElements.content, true);
    this.formElement = addNode.firstElementChild as HTMLFormElement;
    this.formElement.id = 'user-input';

    this.ttlInputElement = this.formElement.querySelector('#title') as HTMLInputElement;
    this.dscrInputElement = this.formElement.querySelector('#description') as HTMLInputElement;
    this.mdInputElement = this.formElement.querySelector('#manday') as HTMLInputElement;

    this.configure();
    this.attach();
// console.log(this.ttlInputElement);
  }

  private configure() {
    this.formElement.addEventListener('submit', this.submitHandler);
    // console.log(this.formElement.input);
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, dscr, manday ] = userInput;
      // console.log(title, dscr, manday);
      projectState.addProject(title, dscr, manday);
      this.clearInputs();
    }
  }

  private gatherUserInput(): [string, string, number] | void {
    const enterdTtl = this.ttlInputElement.value;
    const enterdDscr = this.dscrInputElement.value;
    const enterdMd = this.mdInputElement.value;

    const validTtl: Validatable = {
      value: enterdTtl,
      required: true,
      minlength: 4
    }
    const validDscr: Validatable = {
      value: enterdDscr,
      required: true,
      minlength: 4
    }
    const validMd: Validatable = {
      value: Number(enterdMd),
      required: true,
      max: 900
    }

    if (
      !validate(validTtl) ||
      !validate(validDscr) ||
      !validate(validMd)
    ) {
      alert('入力値が正しくありません');
      return;
    } else {
      return [enterdTtl, enterdDscr, Number(enterdMd)];
    }
  }

  private attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.formElement);
  }

  private clearInputs() {
    this.ttlInputElement.value = '';
    this.dscrInputElement.value = '';
    this.mdInputElement.value = '';
    }
}

const projectState = ProjectState.getInstance();
const finishedPrjList = new ProjectList('finished');
const activePrjList = new ProjectList('active');
const prjInput = new ProjectInput();
