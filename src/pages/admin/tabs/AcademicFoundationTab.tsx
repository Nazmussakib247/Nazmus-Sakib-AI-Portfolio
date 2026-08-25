import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { Field, Modal, EmptyState, inputCls, btnPrimary, btnGhost, cardCls } from '../adminUi';

type CategoryForm = {
  name: string;
  description: string;
  orderIndex: number;
  isVisible: boolean;
};

type CourseForm = {
  categoryId: number;
  name: string;
  shortDescription: string;
  relatedProject: string;
  orderIndex: number;
  isFeatured: boolean;
  isVisible: boolean;
};

const emptyCategory: CategoryForm = {
  name: '',
  description: '',
  orderIndex: 0,
  isVisible: true,
};

const emptyCourse: CourseForm = {
  categoryId: 0,
  name: '',
  shortDescription: '',
  relatedProject: '',
  orderIndex: 0,
  isFeatured: false,
  isVisible: true,
};

export function AcademicFoundationTab() {
  const { data: foundation, refetch } = trpc.academicFoundationAdmin.list.useQuery();
  const categories = useMemo(
    () => [...(foundation || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
    [foundation],
  );
  const courses = useMemo(
    () => categories.flatMap((category) => category.courses || []),
    [categories],
  );
  const [categoryModal, setCategoryModal] = useState(false);
  const [courseModal, setCourseModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourse);

  const createCategory = trpc.academicFoundationAdmin.createCategory.useMutation({
    onSuccess: async () => { await refetch(); setCategoryModal(false); toast.success('Academic category added'); },
    onError: (error) => toast.error(error.message),
  });
  const updateCategory = trpc.academicFoundationAdmin.updateCategory.useMutation({
    onSuccess: async () => { await refetch(); setCategoryModal(false); toast.success('Academic category updated'); },
    onError: (error) => toast.error(error.message),
  });
  const deleteCategory = trpc.academicFoundationAdmin.deleteCategory.useMutation({
    onSuccess: async () => { await refetch(); toast.success('Academic category deleted'); },
    onError: (error) => toast.error(error.message),
  });
  const reorderCategory = trpc.academicFoundationAdmin.reorderCategory.useMutation({
    onSuccess: () => { void refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const createCourse = trpc.academicFoundationAdmin.createCourse.useMutation({
    onSuccess: async () => { await refetch(); setCourseModal(false); toast.success('Course added'); },
    onError: (error) => toast.error(error.message),
  });
  const updateCourse = trpc.academicFoundationAdmin.updateCourse.useMutation({
    onSuccess: async () => { await refetch(); setCourseModal(false); toast.success('Course updated'); },
    onError: (error) => toast.error(error.message),
  });
  const deleteCourse = trpc.academicFoundationAdmin.deleteCourse.useMutation({
    onSuccess: async () => { await refetch(); toast.success('Course deleted'); },
    onError: (error) => toast.error(error.message),
  });
  const reorderCourse = trpc.academicFoundationAdmin.reorderCourse.useMutation({
    onSuccess: () => { void refetch(); },
    onError: (error) => toast.error(error.message),
  });

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ ...emptyCategory, orderIndex: categories.length });
    setCategoryModal(true);
  };

  const openEditCategory = (category: (typeof categories)[number]) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      orderIndex: category.orderIndex ?? 0,
      isVisible: category.isVisible,
    });
    setCategoryModal(true);
  };

  const openCreateCourse = (categoryId?: number) => {
    const targetCategory = categoryId || categories[0]?.id || 0;
    const target = categories.find((category) => category.id === targetCategory);
    setEditingCourseId(null);
    setCourseForm({ ...emptyCourse, categoryId: targetCategory, orderIndex: target?.courses?.length || 0 });
    setCourseModal(true);
  };

  const openEditCourse = (course: (typeof courses)[number]) => {
    setEditingCourseId(course.id);
    setCourseForm({
      categoryId: course.categoryId,
      name: course.name,
      shortDescription: course.shortDescription || '',
      relatedProject: course.relatedProject || '',
      orderIndex: course.orderIndex ?? 0,
      isFeatured: course.isFeatured,
      isVisible: course.isVisible,
    });
    setCourseModal(true);
  };

  const submitCategory = (event: React.FormEvent) => {
    event.preventDefault();
    const data = { ...categoryForm, description: categoryForm.description || undefined };
    if (editingCategoryId) updateCategory.mutate({ id: editingCategoryId, ...data });
    else createCategory.mutate(data);
  };

  const submitCourse = (event: React.FormEvent) => {
    event.preventDefault();
    const data = {
      ...courseForm,
      shortDescription: courseForm.shortDescription || undefined,
      relatedProject: courseForm.relatedProject || undefined,
    };
    if (editingCourseId) updateCourse.mutate({ id: editingCourseId, ...data });
    else createCourse.mutate(data);
  };

  const moveCategory = (index: number, direction: -1 | 1) => {
    const other = categories[index + direction];
    const current = categories[index];
    if (!current || !other) return;
    reorderCategory.mutate({ id: current.id, orderIndex: other.orderIndex ?? index + direction });
    reorderCategory.mutate({ id: other.id, orderIndex: current.orderIndex ?? index });
  };

  const moveCourse = (categoryCourses: (typeof categories)[number]['courses'], index: number, direction: -1 | 1) => {
    const current = categoryCourses[index];
    const other = categoryCourses[index + direction];
    if (!current || !other) return;
    reorderCourse.mutate({ id: current.id, orderIndex: other.orderIndex ?? index + direction });
    reorderCourse.mutate({ id: other.id, orderIndex: current.orderIndex ?? index });
  };

  return (
    <div className="pt-12 lg:pt-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl text-white">Academic Foundation</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500">Manage the database-backed coursework shown on the public portfolio. Categories, order, selected courses, descriptions, and visibility are all editable here.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={openCreateCategory} className={btnGhost}><Plus className="h-4 w-4" /> Category</button>
          <button type="button" onClick={() => openCreateCourse()} disabled={!categories.length} className={btnPrimary}><Plus className="h-4 w-4" /> Course</button>
        </div>
      </div>

      {!categories.length ? (
        <EmptyState text="No academic categories yet. Add a category to start building the public Academic Foundation section." />
      ) : (
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => {
            const categoryCourses = [...(category.courses || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
            return (
              <section key={category.id} className={`${cardCls} overflow-hidden p-0`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-white">{category.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${category.isVisible ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-gray-500'}`}>{category.isVisible ? 'Visible' : 'Hidden'}</span>
                      <span className="rounded-full bg-[#7c5cff]/10 px-2 py-0.5 text-[10px] text-[#b6a4ff]">{categoryCourses.length} courses</span>
                    </div>
                    {category.description && <p className="mt-1 text-xs text-gray-500">{category.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" title="Move category up" aria-label={`Move ${category.name} up`} disabled={categoryIndex === 0} onClick={() => moveCategory(categoryIndex, -1)} className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-white disabled:opacity-25"><ChevronUp className="h-4 w-4" /></button>
                    <button type="button" title="Move category down" aria-label={`Move ${category.name} down`} disabled={categoryIndex === categories.length - 1} onClick={() => moveCategory(categoryIndex, 1)} className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-white disabled:opacity-25"><ChevronDown className="h-4 w-4" /></button>
                    <button type="button" title="Edit category" aria-label={`Edit ${category.name}`} onClick={() => openEditCategory(category)} className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-[#e8b923]"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Delete category" aria-label={`Delete ${category.name}`} onClick={() => { if (confirm(`Delete category “${category.name}”? Courses must be removed first.`)) deleteCategory.mutate({ id: category.id }); }} className="rounded p-1.5 text-gray-500 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {categoryCourses.map((course, courseIndex) => (
                    <div key={course.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#e8b923]/20 bg-[#e8b923]/5 font-mono text-[10px] text-[#e8b923]">{String(courseIndex + 1).padStart(2, '0')}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-gray-200">{course.name}</span>
                            {course.isFeatured && <span title="Selected for the public highlight" className="inline-flex items-center gap-1 rounded-full bg-[#e8b923]/10 px-2 py-0.5 text-[10px] text-[#e8b923]"><Star className="h-3 w-3" /> Selected</span>}
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${course.isVisible ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-gray-500'}`}>{course.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{course.isVisible ? 'Visible' : 'Hidden'}</span>
                          </div>
                          {course.shortDescription && <p className="mt-1 text-xs text-gray-500">{course.shortDescription}</p>}
                          {course.relatedProject && <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#a78bfa]">Applied in {course.relatedProject}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" title="Move course up" aria-label={`Move ${course.name} up`} disabled={courseIndex === 0} onClick={() => moveCourse(categoryCourses, courseIndex, -1)} className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-white disabled:opacity-25"><ChevronUp className="h-4 w-4" /></button>
                        <button type="button" title="Move course down" aria-label={`Move ${course.name} down`} disabled={courseIndex === categoryCourses.length - 1} onClick={() => moveCourse(categoryCourses, courseIndex, 1)} className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-white disabled:opacity-25"><ChevronDown className="h-4 w-4" /></button>
                        <button type="button" title="Edit course" aria-label={`Edit ${course.name}`} onClick={() => openEditCourse(course)} className="rounded p-1.5 text-gray-500 hover:bg-white/5 hover:text-[#e8b923]"><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" title="Delete course" aria-label={`Delete ${course.name}`} onClick={() => { if (confirm(`Delete “${course.name}”?`)) deleteCourse.mutate({ id: course.id }); }} className="rounded p-1.5 text-gray-500 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-3 sm:px-5"><button type="button" onClick={() => openCreateCourse(category.id)} className="inline-flex items-center gap-1.5 text-xs text-[#e8b923] hover:text-white"><Plus className="h-3.5 w-3.5" /> Add course to this category</button></div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {categoryModal && (
        <Modal title={editingCategoryId ? 'Edit Academic Category' : 'Add Academic Category'} onClose={() => setCategoryModal(false)}>
          <form onSubmit={submitCategory} className="space-y-4">
            <Field label="Category name *"><input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} className={inputCls} placeholder="AI & Machine Learning" required /></Field>
            <Field label="Description"><textarea value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} className={`${inputCls} h-20`} placeholder="What this academic area covers" /></Field>
            <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={categoryForm.isVisible} onChange={(event) => setCategoryForm({ ...categoryForm, isVisible: event.target.checked })} className="rounded" />Show this category publicly</label>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setCategoryModal(false)} className={btnGhost}>Cancel</button><button type="submit" disabled={createCategory.isPending || updateCategory.isPending} className={btnPrimary}>{editingCategoryId ? 'Update category' : 'Create category'}</button></div>
          </form>
        </Modal>
      )}

      {courseModal && (
        <Modal title={editingCourseId ? 'Edit Academic Course' : 'Add Academic Course'} onClose={() => setCourseModal(false)}>
          <form onSubmit={submitCourse} className="space-y-4">
            <Field label="Category *"><select value={courseForm.categoryId} onChange={(event) => setCourseForm({ ...courseForm, categoryId: Number(event.target.value) })} className={inputCls} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
            <Field label="Course name *"><input value={courseForm.name} onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })} className={inputCls} placeholder="Data Structures" required /></Field>
            <Field label="Short description"><textarea value={courseForm.shortDescription} onChange={(event) => setCourseForm({ ...courseForm, shortDescription: event.target.value })} className={`${inputCls} h-20`} placeholder="What this course contributed to your foundation" /></Field>
            <Field label="Related project or evidence"><input value={courseForm.relatedProject} onChange={(event) => setCourseForm({ ...courseForm, relatedProject: event.target.value })} className={inputCls} placeholder="AI matching and analytics" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={courseForm.isFeatured} onChange={(event) => setCourseForm({ ...courseForm, isFeatured: event.target.checked })} className="rounded" />Selected coursework</label>
              <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={courseForm.isVisible} onChange={(event) => setCourseForm({ ...courseForm, isVisible: event.target.checked })} className="rounded" />Show publicly</label>
            </div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setCourseModal(false)} className={btnGhost}>Cancel</button><button type="submit" disabled={createCourse.isPending || updateCourse.isPending} className={btnPrimary}>{editingCourseId ? 'Update course' : 'Create course'}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
