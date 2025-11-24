import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Dot, Folder, FolderClosed, Shapes } from 'lucide-react';


const LayerTree: React.FC = () => {
  // Lấy groups và shapes từ store
  const groups = useSelector((state: RootState) => state.shapes.groups);
  const shapes = useSelector((state: RootState) => state.shapes.shapes);

  // Tìm các shape không thuộc group nào
  const groupedShapeIds = groups.flatMap(g => g.shapeIds);
  const ungroupedShapes = shapes.filter(s => !groupedShapeIds.includes(s.id));

  return (
    <div className="w-60 bg-gradient-to-br from-slate-50 to-slate-200 rounded-xl shadow-lg p-2 border border-slate-300">
      <h2 className="font-bold text-xl mb-4 text-slate-800 flex items-center gap-2">
        <FolderClosed />
        Layer Tree
      </h2>
      <ul className="space-y-3">
        {/* Hiển thị các nhóm */}
        {groups.map(group => (
          <li key={group.id} className="bg-white rounded-lg border border-blue-100 shadow-sm p-2 hover:bg-blue-50 transition-all">
            <div className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
              <Folder />
              {group.name}
            </div>  
            <ul className="space-y-1">
              {group.shapeIds.map(shapeId => {
                const shape = shapes.find(s => s.id === shapeId);
                return shape ? (
                  <li key={shape.id} className="flex items-center gap-2 text-gray-700 px-2 py-1 rounded hover:bg-blue-100 cursor-pointer transition-all">
                    <Dot />
                    <span className="font-medium">{shape.type}</span>
                    <span className="text-xs text-gray-400">({shape.id})</span>
                  </li>
                ) : null;
              })}
            </ul>
          </li>
        ))}
        {/* Hiển thị các shape không thuộc group */}
        {ungroupedShapes.length > 0 && (
          <li className="bg-white rounded-lg border border-green-100 shadow-sm p-2 hover:bg-green-50 transition-all">
            <div className="font-semibold text-green-700 flex items-center gap-2 mb-2">
              <Shapes />
              Shapes
            </div>
            <ul className="space-y-1">
              {ungroupedShapes.map(shape => (
                <li key={shape.id} className="flex items-center gap-2 text-gray-700 px-2 py-1 rounded hover:bg-green-100 cursor-pointer transition-all">
                  <Dot />
                  <span className="font-medium">{shape.type}</span>
                  <span className="text-xs text-gray-400">({shape.id})</span>
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
};

export default LayerTree;
