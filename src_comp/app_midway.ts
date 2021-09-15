// Drag & Drop
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public manday: number,
    public state: ProjectStatus,
  ){}
}

enum ProjectStatus {
  Active,
  Finished,
}


// abstract class Component {

//   constructor(
//   ) {
//   }

// }





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

function validate() {
}




class ProjectState {
  projectContainer: Project[] = [];
  projectListeners: Function[] = [];

  constructor() {  }

  addProject(title: string, description: string, manday: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      manday,
      ProjectStatus.Active,
    );
    this.projectContainer.push(newProject);
console.log(this.projectContainer);
  }
}





class ProjectInput {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLFormElement;

  inputTtlElement: HTMLInputElement;
  inputDescElement: HTMLInputElement;
  inputMdElement: HTMLInputElement;

  constructor() {
    this.baseElements = document.getElementById('project-input')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild as HTMLFormElement;
    this.editElements.id = 'user-input';

    this.inputTtlElement = this.editElements.querySelector('#title')!;
    this.inputDescElement = this.editElements.querySelector('#description')!;
    this.inputMdElement = this.editElements.querySelector('#manday')!;

// console.log(this.outputElements);

    this.configure();
    this.attach();
  }

  @autobind
  submitHandler(event: Event) {
    event.preventDefault();
    const inputTtlTx = this.inputTtlElement.value;
    const inputDescTx = this.inputDescElement.value;
    const inputMdTx = +this.inputMdElement.value;

    if (
      inputTtlTx && inputDescTx && inputMdTx
    ) {
      prjState.addProject(inputTtlTx, inputDescTx, inputMdTx);
    } else {
      alert('入力を確認してください');
    }

  }

  configure() {
    this.editElements.addEventListener('submit', this.submitHandler)
  }

  renderContent() {}

  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}





class ProjectList {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLElement;

  assignedProjects: Project[];

  constructor(public listType: 'active' | 'finished') {
    this.baseElements = document.getElementById('project-list')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;

    const nodeTmp = document.importNode(this.baseElements.content, true);
    this.editElements = nodeTmp.firstElementChild as HTMLElement;
    this.editElements.id = `${listType}-projects`;

    this.assignedProjects = [];

// console.log(this.editElements);

    this.configure();
    this.renderContent();
    this.attach();
  }

  renderProjects() {
    const addUlElement = this.editElements.querySelector('ul')!;
    addUlElement.id = `${this.listType}-projects-list`;

  }

  renderContent() {
    const addH2Element = this.editElements.querySelector('h2')!;
    addH2Element.textContent = this.listType === 'active' ? 'active Projects': 'finished Projects';
  }

  configure() {

  }

  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}




class ProjectItem {

  constructor() {  }

  configure() {  }

  renderContent() {  }

  attach() {  }

}




const prjState = new ProjectState();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
